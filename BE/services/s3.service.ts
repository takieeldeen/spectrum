import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export class S3Service {
  private s3Client: S3Client | null = null;
  private region: string;
  private bucket: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";
    this.bucket = process.env.AWS_S3_BUCKET || "spectrum-avatar-bucket";

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Uploads an avatar image to AWS S3 bucket.
   * Cleanly upserts the image so only one avatar per user exists.
   */
  async uploadProfilePicture(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    userId?: string,
    oldImageUrl?: string | null,
  ): Promise<string> {
    if (!this.s3Client || !this.bucket) {
      throw new Error("AWS S3 credentials or bucket not configured");
    }

    const key = `avatars/${fileName}`;

    // Upsert logic for S3: remove previous avatar object if key has changed
    if (oldImageUrl && oldImageUrl.includes(this.bucket)) {
      const match = oldImageUrl.match(/avatars\/([^/?#]+)/);
      if (match && match[1] && match[1] !== fileName) {
        const oldKey = `avatars/${match[1]}`;
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: oldKey,
            }),
          );
          console.log(
            `[S3Service] Upsert: deleted previous S3 avatar: ${oldKey}`,
          );
        } catch (err: any) {
          console.error(
            `[S3Service] Failed to delete previous S3 avatar ${oldKey}:`,
            err?.message || err,
          );
        }
      }
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    const s3Url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    console.log(`[S3Service] Successfully uploaded avatar to S3: ${s3Url}`);
    return s3Url;
  }
}

export default new S3Service();
