import { NextApiRequest, NextApiResponse } from 'next';
import Ajv from 'ajv';

// Shared utilities that work in both browser and Node.js
import { createSupabaseServerClient } from '../../shared/utils/supabase-utils.js';

// Schema
import campaignSchema from '../../shared/schemas/campaign-schema.json' with { type: 'json' };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; id?: number; error?: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Validate the request body against the campaign schema
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(campaignSchema);

    if (!validate(req.body)) {
      const errorMessages = validate.errors
        ?.map((err) => `${err.instancePath} ${err.message}`)
        .join(', ');
      return res.status(400).json({
        message: 'Validation failed',
        error: errorMessages || 'Invalid campaign data',
      });
    }

    // Insert the campaign into the database
    const { error } = await supabase.from('campaigns').insert({
      data: req.body,
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        message: 'Error submitting campaign',
        error: error.message,
      });
    }

    res.status(201).json({
      message:
        "Campaign submitted. Contact us in Chat and we'll notify you when it's approved.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API route error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: errorMessage,
    });
  }
}
