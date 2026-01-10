function safeBase64Decode(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf8');
  } catch (e) {
    // If decoding fails, it might not be base64 encoded, return as is.
    return str;
  }
}

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID is not set');
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('FIREBASE_CLIENT_EMAIL is not set');
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY is not set');
}


export const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key is base64 encoded, so we need to decode it.
  privateKey: safeBase64Decode(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
};
