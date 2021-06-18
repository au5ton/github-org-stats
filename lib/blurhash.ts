/**
 * Based on: https://github.com/woltapp/blurhash/issues/43#issuecomment-597674435
 */

import sharp from 'sharp'
import { encode } from 'blurhash'
import fetch from 'node-fetch'

export function encodeImageToBlurhash(path: string | Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    sharp(path)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err);
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
      });
  });
}

export async function getRemoteImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  return await response.buffer();
}
