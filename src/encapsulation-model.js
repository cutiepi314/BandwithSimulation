/* Educational, deterministic packet builder. No network traffic is generated.
 * References: RFC 791 (IPv4), RFC 8200 (IPv6), RFC 9293 (TCP), RFC 768 (UDP),
 * RFC 1071 (Internet checksum), RFC 1042 (LLC/SNAP).
 * Frame lengths exclude PHY preambles, interframe gaps, ACKs and retransmission.
 */
(function (root) {
  'use strict';

  var defaultConfig = Object.freeze({
    message: 'Ahoj, sieť!', textEncoding: 'utf8', link: 'ethernet',
    transport: 'tcp', ipVersion: 'ipv4', sourcePort: 51514, destPort: 443,
    sourceIp: '192.0.2.10', destIp: '198.51.100.20',
    sourceMac: '02:00:00:00:00:0a', destMac: '02:00:00:00:00:14', ttl: 64
  });
  var encodingLabels = { utf8: 'UTF-8', utf16le: 'UTF-16LE bez BOM', ascii: 'ASCII' };
  var AP_MAC = '02:00:00:00:aa:01';

  function choose(value, fallback, choices, label) {
    var result = value == null ? fallback : value;
    if (choices.indexOf(result) === -1) throw new Error('Neplatná voľba: ' + label + '.');
    return result;
  }
  function integer(value, fallback, min, max, label) {
    var result = value == null ? fallback : Number(value);
    if (value === '' || !Number.isInteger(result) || result < min || result > max) {
      throw new Error(label + ' musí byť celé číslo od ' + min + ' do ' + max + '.');
    }
    return result;
  }
  function hex(value, width) { return '0x' + value.toString(16).toUpperCase().padStart(width || 4, '0'); }
  function u16(value) { return [(value >>> 8) & 255, value & 255]; }
  function u32(value) { return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]; }
  function put16(bytes, offset, value) { bytes[offset] = (value >>> 8) & 255; bytes[offset + 1] = value & 255; }
  function get16(bytes, offset) { return bytes[offset] * 256 + bytes[offset + 1]; }

  function encodeText(message, encoding) {
    encoding = choose(encoding, 'utf8', ['utf8', 'utf16le', 'ascii'], 'kódovanie textu');
    if (typeof message !== 'string') throw new Error('Správa musí byť text.');
    var bytes = [];
    for (var i = 0; i < message.length; i += 1) {
      var code = message.charCodeAt(i);
      if (encoding === 'ascii') {
        if (code > 127) throw new Error('ASCII podporuje iba znaky 0–127. Odstráň diakritiku a emoji alebo zvoľ UTF-8/UTF-16LE.');
        bytes.push(code);
        continue;
      }
      if (code >= 0xd800 && code <= 0xdbff) {
        var low = message.charCodeAt(i + 1);
        if (!(low >= 0xdc00 && low <= 0xdfff)) throw new Error('Správa obsahuje neplatný znak Unicode.');
        if (encoding === 'utf16le') bytes.push(code & 255, code >>> 8, low & 255, low >>> 8);
        code = 0x10000 + ((code - 0xd800) << 10) + low - 0xdc00;
        i += 1;
        if (encoding === 'utf16le') continue;
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        throw new Error('Správa obsahuje neplatný znak Unicode.');
      } else if (encoding === 'utf16le') {
        bytes.push(code & 255, code >>> 8);
        continue;
      }
      if (code < 0x80) bytes.push(code);
      else if (code < 0x800) bytes.push(0xc0 | (code >>> 6), 0x80 | (code & 63));
      else if (code < 0x10000) bytes.push(0xe0 | (code >>> 12), 0x80 | ((code >>> 6) & 63), 0x80 | (code & 63));
      else bytes.push(0xf0 | (code >>> 18), 0x80 | ((code >>> 12) & 63), 0x80 | ((code >>> 6) & 63), 0x80 | (code & 63));
    }
    return bytes;
  }

  function ipv4(text, label) {
    var groups = String(text).trim().split('.');
    if (groups.length !== 4 || groups.some(function (x) { return !/^(0|[1-9][0-9]{0,2})$/.test(x) || Number(x) > 255; })) {
      throw new Error(label + ' musí byť platná IPv4 adresa, napr. 192.0.2.10.');
    }
    return { bytes: groups.map(Number), text: groups.join('.') };
  }

  function ipv6(text, label) {
    var address = String(text).trim().toLowerCase();
    function invalid() { throw new Error(label + ' musí byť platná IPv6 adresa, napr. 2001:db8::10.'); }
    if (address.indexOf('.') !== -1) {
      var lastColon = address.lastIndexOf(':');
      if (lastColon < 0) invalid();
      var embedded;
      try { embedded = ipv4(address.slice(lastColon + 1), label).bytes; } catch (_) { invalid(); }
      address = address.slice(0, lastColon + 1) + get16(embedded, 0).toString(16) + ':' + get16(embedded, 2).toString(16);
    }
    var halves = address.split('::');
    if (halves.length > 2) invalid();
    var left = halves[0] ? halves[0].split(':') : [];
    var right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    var count = left.length + right.length;
    if (left.concat(right).some(function (part) { return !/^[0-9a-f]{1,4}$/.test(part); })) invalid();
    if ((halves.length === 1 && count !== 8) || (halves.length === 2 && count >= 8)) invalid();
    var groups = left.concat(new Array(8 - count).fill('0'), right).map(function (part) { return parseInt(part, 16); });
    // RFC 5952 style compression: the first longest run, at least two zero words.
    var bestStart = -1, bestLength = 1;
    for (var i = 0; i < 8;) {
      if (groups[i] !== 0) { i += 1; continue; }
      var start = i;
      while (i < 8 && groups[i] === 0) i += 1;
      if (i - start > bestLength) { bestStart = start; bestLength = i - start; }
    }
    var words = groups.map(function (part) { return part.toString(16); });
    var normalized = bestStart === -1 ? words.join(':') : words.slice(0, bestStart).join(':') + '::' + words.slice(bestStart + bestLength).join(':');
    return { bytes: groups.reduce(function (bytes, word) { return bytes.concat(u16(word)); }, []), text: normalized };
  }

  function mac(text, label) {
    var address = String(text).trim().toLowerCase();
    if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(address) && !/^([0-9a-f]{2}-){5}[0-9a-f]{2}$/.test(address)) {
      throw new Error(label + ' musí mať šesť dvojíc hexadecimálnych číslic, napr. 02:00:00:00:00:0a.');
    }
    address = address.replace(/-/g, ':');
    return { bytes: address.split(':').map(function (part) { return parseInt(part, 16); }), text: address };
  }

  // RFC 1071: one's-complement sum over 16-bit words, odd byte zero-padded.
  function checksum(bytes) {
    var sum = 0;
    for (var i = 0; i < bytes.length; i += 2) sum += (bytes[i] << 8) + (bytes[i + 1] || 0);
    while (sum >>> 16) sum = (sum & 0xffff) + (sum >>> 16);
    return (~sum) & 0xffff;
  }

  // CRC-32/ISO-HDLC, reflected polynomial, used by Ethernet and 802.11 FCS.
  function crc32(bytes) {
    var crc = 0xffffffff;
    bytes.forEach(function (byte) {
      crc ^= byte;
      for (var bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    });
    return (crc ^ 0xffffffff) >>> 0;
  }

  function field(bytes, key, label, offset, length, value, description) {
    return { key: key, label: label, offset: offset, length: length, bytes: bytes.slice(offset, offset + length), value: value, description: description };
  }
  function header(label, bytes, description, fields) {
    return { label: label, bytes: bytes, length: bytes.length, description: description, fields: fields };
  }

  function build(input) {
    input = input || {};
    var cfg = {
      message: input.message == null ? defaultConfig.message : input.message,
      textEncoding: choose(input.textEncoding, 'utf8', ['utf8', 'utf16le', 'ascii'], 'kódovanie'),
      link: choose(input.link, 'ethernet', ['ethernet', 'wifi'], 'linková vrstva'),
      transport: choose(input.transport, 'tcp', ['tcp', 'udp'], 'transportný protokol'),
      ipVersion: choose(input.ipVersion, 'ipv4', ['ipv4', 'ipv6'], 'verzia IP'),
      sourcePort: integer(input.sourcePort, defaultConfig.sourcePort, 1, 65535, 'Zdrojový port'),
      destPort: integer(input.destPort == null ? input.destinationPort : input.destPort, defaultConfig.destPort, 1, 65535, 'Cieľový port'),
      ttl: integer(input.ttl, 64, 1, 255, 'TTL / Hop limit')
    };
    var isV6 = cfg.ipVersion === 'ipv6';
    var parseIp = isV6 ? ipv6 : ipv4;
    var srcIp = parseIp(input.sourceIp || (isV6 ? '2001:db8:1::10' : defaultConfig.sourceIp), 'Zdrojová IP');
    var dstIp = parseIp(input.destIp || input.destinationIp || (isV6 ? '2001:db8:2::20' : defaultConfig.destIp), 'Cieľová IP');
    var srcMac = mac(input.sourceMac || defaultConfig.sourceMac, 'Zdrojová MAC');
    var dstMac = mac(input.destMac || input.destinationMac || defaultConfig.destMac, 'Cieľová MAC');
    cfg.sourceIp = srcIp.text; cfg.destIp = dstIp.text;
    cfg.sourceMac = srcMac.text; cfg.destMac = dstMac.text;
    var payload = encodeText(cfg.message, cfg.textEncoding);
    if (payload.length > 512) throw new Error('Správa má ' + payload.length + ' B. Tento model podporuje najviac 512 B po zakódovaní.');
    var protocol = cfg.transport === 'tcp' ? 6 : 17;
    var transportLength = cfg.transport === 'tcp' ? 20 : 8;
    var th = new Array(transportLength).fill(0);
    put16(th, 0, cfg.sourcePort); put16(th, 2, cfg.destPort);
    if (cfg.transport === 'tcp') {
      th[7] = 1; th[11] = 1; th[12] = 0x50; th[13] = 0x18; put16(th, 14, 65535);
    } else put16(th, 4, th.length + payload.length);
    var pseudo = srcIp.bytes.concat(dstIp.bytes, isV6 ? u32(th.length + payload.length).concat([0, 0, 0, protocol]) : [0, protocol].concat(u16(th.length + payload.length)));
    var transportChecksum = checksum(pseudo.concat(th, payload));
    if (cfg.transport === 'udp' && transportChecksum === 0) transportChecksum = 0xffff;
    put16(th, cfg.transport === 'tcp' ? 16 : 6, transportChecksum);
    var tf = [
      field(th, 'source-port', 'Zdrojový port', 0, 2, cfg.sourcePort, 'Identifikuje odosielajúcu aplikáciu.'),
      field(th, 'destination-port', 'Cieľový port', 2, 2, cfg.destPort, 'Identifikuje cieľovú aplikáciu; samotné číslo portu neurčuje obsah správy.')
    ];
    if (cfg.transport === 'tcp') {
      tf.push(field(th, 'sequence', 'Sequence number', 4, 4, 1, 'Poradové číslo prvého dátového bajtu. Ukážka už vytvoreného TCP spojenia.'));
      tf.push(field(th, 'acknowledgment', 'Acknowledgment number', 8, 4, 1, 'Číslo ďalšieho očakávaného bajtu od druhej strany.'));
      tf.push(field(th, 'flags', 'Dĺžka + príznaky', 12, 2, '20 B; PSH, ACK', 'TCP hlavička má 5 × 4 B bez voliteľných polí.'));
      tf.push(field(th, 'window', 'Okno', 14, 2, 65535, 'Prijímacie okno pre riadenie toku.'));
      tf.push(field(th, 'checksum', 'TCP checksum', 16, 2, hex(transportChecksum), 'Kontroluje TCP hlavičku, dáta a pseudohlavičku s IP adresami.'));
      tf.push(field(th, 'urgent', 'Urgent pointer', 18, 2, 0, 'V tejto ukážke sa nepoužíva.'));
    } else {
      tf.push(field(th, 'length', 'Dĺžka UDP', 4, 2, th.length + payload.length, '8 B hlavičky plus zakódovaná správa.'));
      tf.push(field(th, 'checksum', 'UDP checksum', 6, 2, hex(transportChecksum), 'Kontroluje UDP hlavičku, dáta a pseudohlavičku s IP adresami.'));
    }
    var transportHeader = header(cfg.transport.toUpperCase(), th, cfg.transport === 'tcp' ? '20 B základnej TCP hlavičky: porty, poradie, potvrdenie, príznaky, okno a kontrolný súčet.' : '8 B UDP hlavičky: dva porty, dĺžka a kontrolný súčet.', tf);
    var segment = th.concat(payload);
    var ih;
    if (isV6) {
      ih = [0x60, 0, 0, 0].concat(u16(segment.length), [protocol, cfg.ttl], srcIp.bytes, dstIp.bytes);
    } else {
      ih = [0x45, 0].concat(u16(20 + segment.length), [0, 1, 0x40, 0, cfg.ttl, protocol, 0, 0], srcIp.bytes, dstIp.bytes);
      put16(ih, 10, checksum(ih));
    }
    var nf = isV6 ? [
      field(ih, 'version', 'Verzia + trieda + flow label', 0, 4, 'IPv6; 0; 0', 'Pevná základná hlavička IPv6 má 40 B.'),
      field(ih, 'length', 'Payload length', 4, 2, segment.length, 'Počet bajtov za základnou IPv6 hlavičkou.'),
      field(ih, 'protocol', 'Next header', 6, 1, protocol + ' (' + cfg.transport.toUpperCase() + ')', 'Určuje nasledujúci protokol.'),
      field(ih, 'ttl', 'Hop limit', 7, 1, cfg.ttl, 'Smerovač pri preposlaní znižuje hodnotu o 1.'),
      field(ih, 'source-ip', 'Zdrojová IPv6', 8, 16, cfg.sourceIp, 'IP adresa odosielateľa.'),
      field(ih, 'destination-ip', 'Cieľová IPv6', 24, 16, cfg.destIp, 'IP adresa konečného príjemcu.')
    ] : [
      field(ih, 'version', 'Verzia + IHL', 0, 1, 'IPv4; 20 B', 'Verzia 4 a 5 × 4 B základnej hlavičky.'),
      field(ih, 'dscp', 'DSCP + ECN', 1, 1, 0, 'Základná trieda služby bez označenia preťaženia.'),
      field(ih, 'length', 'Celková dĺžka IP', 2, 2, ih.length + segment.length, 'IPv4 hlavička plus celá transportná jednotka.'),
      field(ih, 'identification', 'Identification', 4, 2, 1, 'Ukážkový identifikátor; paket sa nefragmentuje.'),
      field(ih, 'fragment', 'Flags + fragment offset', 6, 2, 'DF = 1; offset = 0', 'Príznak Don’t Fragment. Správa má najviac 512 B.'),
      field(ih, 'ttl', 'TTL', 8, 1, cfg.ttl, 'Smerovač pri preposlaní znižuje hodnotu; bráni nekonečnému obehu.'),
      field(ih, 'protocol', 'Protocol', 9, 1, protocol + ' (' + cfg.transport.toUpperCase() + ')', 'Určuje transportný protokol.'),
      field(ih, 'checksum', 'IPv4 checksum', 10, 2, hex(get16(ih, 10)), 'Chráni iba IPv4 hlavičku, nie prenášané dáta.'),
      field(ih, 'source-ip', 'Zdrojová IPv4', 12, 4, cfg.sourceIp, 'IP adresa odosielateľa.'),
      field(ih, 'destination-ip', 'Cieľová IPv4', 16, 4, cfg.destIp, 'IP adresa konečného príjemcu.')
    ];
    var ipHeader = header(isV6 ? 'IPv6' : 'IPv4', ih, isV6 ? '40 B základnej IPv6 hlavičky. IPv6 nemá kontrolný súčet hlavičky.' : '20 B základnej IPv4 hlavičky bez voliteľných polí.', nf);
    var packet = ih.concat(segment);
    var etherType = isV6 ? 0x86dd : 0x0800;
    var lh, lf;
    if (cfg.link === 'ethernet') {
      lh = dstMac.bytes.concat(srcMac.bytes, u16(etherType));
      lf = [
        field(lh, 'destination-mac', 'Cieľová MAC', 0, 6, cfg.destMac, 'Adresa príjemcu na tomto linkovom úseku; pri vzdialenej IP sieti typicky MAC brány.'),
        field(lh, 'source-mac', 'Zdrojová MAC', 6, 6, cfg.sourceMac, 'Adresa odosielajúceho rozhrania na tomto úseku.'),
        field(lh, 'ethertype', 'EtherType', 12, 2, hex(etherType), 'Identifikuje vnorený protokol ' + ipHeader.label + '.')
      ];
    } else {
      // Unencrypted, non-QoS infrastructure Data frame sent by a station to AP.
      lh = [0x08, 0x01, 0, 0].concat(mac(AP_MAC, 'AP MAC').bytes, srcMac.bytes, dstMac.bytes, [0x10, 0], [0xaa, 0xaa, 0x03, 0, 0, 0], u16(etherType));
      lf = [
        field(lh, 'frame-control', 'Frame control', 0, 2, 'Data; To DS = 1', 'Nešifrovaný dátový rámec bez QoS, zo stanice k prístupovému bodu.'),
        field(lh, 'duration', 'Duration', 2, 2, 0, 'Ilustračná nulová rezervácia média; časovanie Wi-Fi sa nemodeluje.'),
        field(lh, 'receiver-ap', 'Address 1: AP / BSSID', 4, 6, AP_MAC, 'Bezprostredný rádiový príjemca je prístupový bod.'),
        field(lh, 'source-mac', 'Address 2: zdrojová MAC', 10, 6, cfg.sourceMac, 'Odosielajúca Wi-Fi stanica.'),
        field(lh, 'destination-mac', 'Address 3: cieľová MAC', 16, 6, cfg.destMac, 'Linkový cieľ v distribučnom systéme; môže ním byť brána.'),
        field(lh, 'sequence', 'Sequence control', 22, 2, 'Seq = 1; fragment = 0', 'Poradové číslo Wi-Fi rámca, odlišné od TCP Sequence number.'),
        field(lh, 'llc-snap', 'LLC / SNAP', 24, 8, 'AA AA 03 00 00 00 ' + hex(etherType), '8 B určujúcich vnorený protokol ' + ipHeader.label + '.')
      ];
    }
    var linkHeader = header(cfg.link === 'ethernet' ? 'Ethernet II' : 'Wi-Fi + LLC/SNAP', lh, cfg.link === 'ethernet' ? '14 B Ethernet II hlavičky; bez VLAN.' : '24 B MAC hlavičky + 8 B LLC/SNAP. Zjednodušená nešifrovaná Wi-Fi bez QoS.', lf);
    var padding = cfg.link === 'ethernet' ? new Array(Math.max(0, 46 - packet.length)).fill(0) : [];
    var withoutFcs = lh.concat(packet, padding);
    var crc = crc32(withoutFcs);
    var fcs = [crc & 255, (crc >>> 8) & 255, (crc >>> 16) & 255, (crc >>> 24) & 255];
    var frame = withoutFcs.concat(fcs);
    var parts = [], offset = 0;
    function add(key, label, bytes, description, fields) {
      parts.push({ key: key, label: label, bytes: bytes, length: bytes.length, offset: offset, description: description, fields: fields || [] });
      offset += bytes.length;
    }
    add('link', linkHeader.label, lh, linkHeader.description, lf);
    add('ip', ipHeader.label, ih, ipHeader.description, nf);
    add('transport', transportHeader.label, th, transportHeader.description, tf);
    add('payload', 'Dáta · ' + encodingLabels[cfg.textEncoding], payload, 'Zakódovaná správa. Kódovanie mení reprezentáciu textu, nie jeho význam; nejde o šifrovanie.');
    if (padding.length) add('padding', 'Výplň Ethernet', padding, 'Doplní obsah Ethernet rámca aspoň na 46 B. Výplň nepatrí do IP paketu ani do správy.');
    add('fcs', 'FCS · CRC-32', fcs, '4 B na detekciu poškodenia celého rámca pred FCS. Vypočítaná hodnota ' + hex(crc, 8) + ', bajty v poradí little-endian.');
    return {
      config: cfg, payloadText: cfg.message, payloadBytes: payload,
      transportBytes: segment, packetBytes: packet, frameBytes: frame,
      parts: parts, headers: { transport: transportHeader, ip: ipHeader, link: linkHeader },
      summary: {
        payloadBytes: payload.length, transportHeaderBytes: th.length, ipHeaderBytes: ih.length,
        linkHeaderBytes: lh.length, paddingBytes: padding.length, fcsBytes: 4,
        transportBytes: segment.length, packetBytes: packet.length, frameBytes: frame.length,
        overheadBytes: frame.length - payload.length, efficiency: payload.length / frame.length,
        frameBits: frame.length * 8, transportChecksum: transportChecksum,
        ipChecksum: isV6 ? null : get16(ih, 10), fcs: crc
      },
      notes: [
        'Jeden ilustračný dátový prenos, najviac 512 B správy. Bez fragmentácie, IP/TCP voliteľných polí a VLAN.',
        'Dĺžka rámca zahŕňa FCS; nezahŕňa fyzickú preambulu, medzeru medzi rámcami, potvrdenia ani opakovania.',
        cfg.transport === 'tcp' ? 'TCP ukazuje dátový segment už vytvoreného spojenia. Handshake, odpovede a opakované prenosy sa tu nepočítajú.' : 'UDP samo neposkytuje potvrdenie, poradie ani opakovanie prenosu.',
        cfg.link === 'wifi' ? 'Wi-Fi: model Data, To DS = 1, 24 B MAC + 8 B LLC/SNAP + 4 B FCS; bez QoS, WPA a agregácie. AP má pevnú BSSID ' + AP_MAC + '.' : 'Ethernet II: 14 B hlavičky + najmenej 46 B obsahu + 4 B FCS.'
      ]
    };
  }

  var api = Object.freeze({ build: build, encodeText: encodeText, checksum: checksum, crc32: crc32, defaultConfig: defaultConfig, encodingLabels: encodingLabels });
  root.EncapsulationModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
