// Lazy initialize Resend to avoid startup errors if API key is missing
let resendInstance: any = null;

export const getResend = async (): Promise<any> => {
  if (!resendInstance) {
    try {
      const { Resend } = await import("resend");
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error(
          "RESEND_API_KEY is not configured. Please set it in your .env file.",
        );
      }
      resendInstance = new Resend(apiKey);
    } catch (error) {
      console.error("Failed to initialize Resend:", error);
      throw error;
    }
  }
  return resendInstance;
};

export const resend = {
  emails: {
    send: async (options: any) => {
      const instance = await getResend();
      return instance.emails.send(options);
    },
  },
};

export const DEFAULT_FROM_EMAIL = "noreply@maono-ops.com";
