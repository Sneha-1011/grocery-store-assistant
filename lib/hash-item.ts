"use server"

import crypto from "crypto"

export async function hashItem(item: string): Promise<string> {
  return crypto.createHash("md5").update(item).digest("hex")
}
