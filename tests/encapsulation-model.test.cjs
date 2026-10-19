'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../src/encapsulation-model.js');

function u16(bytes, offset) { return bytes[offset] * 256 + bytes[offset + 1]; }
function independentlySum(bytes) {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    sum += bytes[i] * 256 + (bytes[i + 1] || 0);
    if (sum > 65535) sum -= 65535;
  }
  return sum;
}

test('published checksum vectors, including odd octet handling and standard CRC check', () => {
  // RFC 1071, section 3: sum = DDF2, checksum = 220D.
  assert.equal(M.checksum([0x00, 0x01, 0xf2, 0x03, 0xf4, 0xf5, 0xf6, 0xf7]), 0x220d);
  assert.equal(M.checksum([0x01]), 0xfeff);
  assert.equal(M.crc32([...Buffer.from('123456789')]), 0xcbf43926);
  assert.equal(M.crc32([]), 0);
});

test('encodings preserve Slovak text and emoji with expected byte sequences', () => {
  assert.deepEqual(M.encodeText('Ať🙂', 'utf8'), [65, 0xc5, 0xa5, 0xf0, 0x9f, 0x99, 0x82]);
  assert.deepEqual(M.encodeText('Ať🙂', 'utf16le'), [65, 0, 0x65, 0x01, 0x3d, 0xd8, 0x42, 0xde]);
  assert.deepEqual(M.encodeText('A\n', 'ascii'), [65, 10]);
  assert.throws(() => M.encodeText('sieť', 'ascii'), /ASCII/);
  assert.throws(() => M.encodeText('\ud800', 'utf8'), /Unicode/);
  assert.throws(() => M.encodeText('\udfff', 'utf16le'), /Unicode/);
});

test('all link/IP/transport combinations have complete, valid packet structure', () => {
  for (const link of ['ethernet', 'wifi']) for (const ipVersion of ['ipv4', 'ipv6']) for (const transport of ['tcp', 'udp']) {
    const r = M.build({message: 'Zažime sieť 🙂', link, ipVersion, transport});
    const ip = r.headers.ip.bytes;
    const segment = r.transportBytes;
    const protocol = transport === 'tcp' ? 6 : 17;
    const n = segment.length;
    const pseudo = ipVersion === 'ipv4'
      ? ip.slice(12, 20).concat([0, protocol, n >>> 8, n & 255])
      : ip.slice(8, 40).concat([0, 0, n >>> 8, n & 255, 0, 0, 0, protocol]);
    assert.equal(independentlySum(pseudo.concat(segment)), 0xffff);
    if (ipVersion === 'ipv4') {
      assert.equal(independentlySum(ip), 0xffff);
      assert.equal(u16(ip, 2), r.packetBytes.length);
      assert.equal(ip[9], protocol);
    } else {
      assert.equal(u16(ip, 4), segment.length);
      assert.equal(ip[6], protocol);
    }
    if (transport === 'udp') assert.equal(u16(segment, 4), segment.length);
    assert.equal(r.summary.linkHeaderBytes, link === 'wifi' ? 32 : 14);
    assert.equal(r.summary.transportHeaderBytes, transport === 'tcp' ? 20 : 8);
    assert.equal(r.summary.ipHeaderBytes, ipVersion === 'ipv6' ? 40 : 20);
    assert.equal(r.summary.frameBytes, r.frameBytes.length);
    assert.deepEqual(r.parts.flatMap(p => p.bytes), r.frameBytes);
    let offset = 0;
    for (const part of r.parts) { assert.equal(part.offset, offset); offset += part.length; }
    assert.equal(M.crc32(r.frameBytes), 0x2144df1c, 'standard CRC residue after appended little-endian FCS');
    assert.equal(Buffer.from(r.payloadBytes).toString('utf8'), 'Zažime sieť 🙂');
  }
});

test('Ethernet padding stays outside the IP datagram and responds to payload size', () => {
  const empty = M.build({message: '', transport: 'udp'});
  assert.equal(empty.packetBytes.length, 28);
  assert.equal(empty.summary.paddingBytes, 18);
  assert.equal(empty.frameBytes.length, 64);
  assert.equal(empty.summary.efficiency, 0);
  assert.equal(M.build({message: 'x'.repeat(18), transport: 'udp'}).summary.paddingBytes, 0);
  assert.equal(M.build({message: 'x'.repeat(19), transport: 'udp'}).frameBytes.length, 65);
  const wifi = M.build({message: '', transport: 'udp', link: 'wifi'});
  assert.equal(wifi.summary.paddingBytes, 0);
  assert.deepEqual(wifi.headers.link.bytes.slice(0, 2), [8, 1]);
  assert.deepEqual(wifi.headers.link.bytes.slice(24, 30), [170, 170, 3, 0, 0, 0]);
});

test('changing ports, IP, MAC and text changes only expected protocol checksums', () => {
  const base = M.build({message: 'A'});
  const port = M.build({message: 'A', destPort: 53});
  assert.notEqual(base.summary.transportChecksum, port.summary.transportChecksum);
  assert.equal(base.summary.ipChecksum, port.summary.ipChecksum);
  assert.notEqual(base.summary.fcs, port.summary.fcs);
  const ip = M.build({message: 'A', destIp: '198.51.100.21'});
  assert.notEqual(base.summary.transportChecksum, ip.summary.transportChecksum);
  assert.notEqual(base.summary.ipChecksum, ip.summary.ipChecksum);
  const mac = M.build({message: 'A', destMac: '02:00:00:00:00:15'});
  assert.deepEqual(mac.packetBytes, base.packetBytes);
  assert.notEqual(base.summary.fcs, mac.summary.fcs);
  const text = M.build({message: 'B'});
  assert.notEqual(base.summary.transportChecksum, text.summary.transportChecksum);
  assert.equal(base.summary.ipChecksum, text.summary.ipChecksum);
  assert.notEqual(base.summary.fcs, text.summary.fcs);
});

test('IPv6 compression and IPv4-mapped syntax normalize correctly', () => {
  const r = M.build({ipVersion: 'ipv6', sourceIp: '2001:0DB8:0000:0000:0001:0000:0000:0001', destIp: '::ffff:192.0.2.20'});
  assert.equal(r.config.sourceIp, '2001:db8::1:0:0:1');
  assert.equal(r.config.destIp, '::ffff:c000:214');
  assert.equal(M.build({ipVersion: 'ipv6', sourceIp: '::', destIp: '::1'}).config.sourceIp, '::');
});

test('input validation catches malformed addresses, numeric values and encoded size', () => {
  for (const address of ['300.1.1.1', '1.2.3', '1.2.3.04', 'x.2.3.4']) assert.throws(() => M.build({sourceIp: address}), /IPv4/);
  for (const address of ['2001::db8::1', '1:2:3', 'gg::', '1:2:3:4:5:6:7:8::']) assert.throws(() => M.build({ipVersion: 'ipv6', sourceIp: address}), /IPv6/);
  assert.throws(() => M.build({sourceMac: 'xx:00:00:00:00:00'}), /MAC/);
  for (const destPort of [0, -1, 65536, 1.5, '', 'NaN']) assert.throws(() => M.build({destPort}), /port/);
  assert.throws(() => M.build({ttl: 256}), /TTL/);
  assert.throws(() => M.build({transport: 'other'}), /voľba/);
  assert.equal(M.build({message: 'x'.repeat(512)}).payloadBytes.length, 512);
  assert.throws(() => M.build({message: 'x'.repeat(513)}), /512 B/);
  assert.throws(() => M.build({message: 'ť'.repeat(257)}), /512 B/);
  assert.equal(M.build({message: 'x'.repeat(256), textEncoding: 'utf16le'}).payloadBytes.length, 512);
});

test('destination aliases work and browser global needs no Node or Web APIs', () => {
  const r = M.build({destinationPort: 53, destinationIp: '203.0.113.7', destinationMac: '02-00-00-00-00-07'});
  assert.equal(r.config.destPort, 53);
  assert.equal(r.config.destIp, '203.0.113.7');
  assert.equal(r.config.destMac, '02:00:00:00:00:07');
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../src/encapsulation-model.js'), 'utf8'), context);
  assert.equal(context.EncapsulationModel.build({message: '🙂'}).payloadBytes.length, 4);
});
