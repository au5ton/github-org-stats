/**
 * Based on: https://github.com/woltapp/blurhash/issues/43#issuecomment-597674435
 */

import sharp from 'sharp'
import { decode, encode } from 'blurhash'
import fetch from 'node-fetch'

export function encodeImageToBlurhash(path: string | Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    sharp(path)
      .raw()
      .ensureAlpha()
      .resize(16, 16, { fit: "inside" })
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

/**
 * From: https://github.com/woltapp/blurhash/issues/43#issuecomment-759112713
 */
export const generateBlurhashURI = async (
  hash: string,
  width: number,
  height: number,
  options = {
    size: 16,
    quality: 40,
  }
) => {
  const hashWidth = options?.size;
  const hashHeight = Math.round(hashWidth * (height / width));

  const pixels = decode(hash, hashWidth, hashHeight);

  const resizedImageBuf = await sharp(Buffer.from(pixels), {
    raw: {
      channels: 4,
      width: hashWidth,
      height: hashHeight,
    },
  })
    .jpeg({
      overshootDeringing: true,
      quality: 40,
    })
    .toBuffer(); // Here also possible to do whatever with your image, e.g. save it or something else.

  return `data:image/jpeg;base64,${resizedImageBuf.toString("base64")}`;
};
