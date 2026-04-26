/**
 * Base32 decode
 */
function base32ToBytes(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.ceil((base32.length * 5) / 8));

    for (let i = 0; i < base32.length; i++) {
        const char = base32[i].toUpperCase();
        const val = alphabet.indexOf(char);
        if (val === -1) continue;
        
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return output.slice(0, index);
}

/**
 * Pure JS SHA-1 implementation
 */
function sha1(message: Uint8Array): Uint8Array {
    function f(s: number, x: number, y: number, z: number) {
        switch (s) {
            case 0: return (x & y) ^ (~x & z);
            case 1: return x ^ y ^ z;
            case 2: return (x & y) ^ (x & z) ^ (y & z);
            case 3: return x ^ y ^ z;
        }
        return 0;
    }

    function ROTL(x: number, n: number) {
        return (x << n) | (x >>> (32 - n));
    }

    const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
    const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

    let mLen = message.length;
    let bitLen = mLen * 8;
    let padLen = (mLen % 64 < 56) ? 56 - (mLen % 64) : 120 - (mLen % 64);
    let padded = new Uint8Array(mLen + padLen + 8);
    padded.set(message);
    padded[mLen] = 0x80;
    let dv = new DataView(padded.buffer);
    
    // JS bitwise operators are 32-bit, so we set the 64-bit length correctly
    dv.setUint32(padded.length - 8, Math.floor(bitLen / Math.pow(2, 32)), false);
    dv.setUint32(padded.length - 4, bitLen % Math.pow(2, 32), false);

    let W = new Int32Array(80);
    for (let i = 0; i < padded.length; i += 64) {
        let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];
        for (let j = 0; j < 80; j++) {
            if (j < 16) {
                W[j] = dv.getInt32(i + j * 4, false);
            } else {
                W[j] = ROTL(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1);
            }
            let s = Math.floor(j / 20);
            let t = (ROTL(a, 5) + f(s, b, c, d) + e + W[j] + K[s]) | 0;
            e = d; d = c; c = ROTL(b, 30); b = a; a = t;
        }
        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0;
    }

    let out = new Uint8Array(20);
    let outDv = new DataView(out.buffer);
    for (let i = 0; i < 5; i++) {
        outDv.setInt32(i * 4, H[i], false);
    }
    return out;
}

/**
 * Pure JS HMAC-SHA-1 implementation
 */
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
    let k = key;
    if (k.length > 64) {
        k = sha1(k);
    }
    let k_ipad = new Uint8Array(64);
    let k_opad = new Uint8Array(64);
    k_ipad.set(k);
    k_opad.set(k);
    
    for (let i = 0; i < 64; i++) {
        k_ipad[i] ^= 0x36;
        k_opad[i] ^= 0x5c;
    }

    let inner = new Uint8Array(64 + message.length);
    inner.set(k_ipad);
    inner.set(message, 64);
    let innerHash = sha1(inner);

    let outer = new Uint8Array(64 + 20);
    outer.set(k_opad);
    outer.set(innerHash, 64);
    return sha1(outer);
}

/**
 * Generates a 6-digit TOTP code
 */
export function generateTOTP(secret: string, timestamp: number = Date.now()): string {
    const key = base32ToBytes(secret);
    const time = Math.floor(timestamp / 1000 / 30);
    
    // time to 8 bytes buffer (big-endian)
    const timeBuffer = new Uint8Array(8);
    const dv = new DataView(timeBuffer.buffer);
    
    // JS bitwise operators are 32-bit. We have to set upper and lower 32 bits separately
    dv.setUint32(0, Math.floor(time / Math.pow(2, 32)), false);
    dv.setUint32(4, time % Math.pow(2, 32), false);

    const hash = hmacSha1(key, timeBuffer);

    const offset = hash[hash.length - 1] & 0xf;
    const binary = 
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}
