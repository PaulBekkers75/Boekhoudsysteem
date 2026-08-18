import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import { CATEGORIES } from '../db.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const EXTRACT_TOOL = {
  name: 'record_invoice_data',
  description:
    'Record the structured data extracted from a Dutch freelance invoice or receipt.',
  input_schema: {
    type: 'object',
    properties: {
      invoice_date: {
        type: 'string',
        description: 'Invoice/receipt date in YYYY-MM-DD format. Best guess if unclear.',
      },
      vendor: {
        type: 'string',
        description: 'Name of the vendor / supplier / company that issued the invoice.',
      },
      amount_excl_btw: {
        type: 'number',
        description: 'Total amount excluding BTW (VAT), as a number, e.g. 100.00.',
      },
      btw_rate: {
        type: 'number',
        description:
          'BTW (VAT) rate applied, as a percentage number: 21, 9, or 0. Use the standard Dutch rate that best matches the document.',
      },
      btw_amount: {
        type: 'number',
        description: 'Total BTW (VAT) amount, as a number, e.g. 21.00.',
      },
      total_amount: {
        type: 'number',
        description: 'Total amount including BTW, as a number, e.g. 121.00.',
      },
      category: {
        type: 'string',
        enum: CATEGORIES,
        description:
          'Best-fit expense category for Dutch freelance bookkeeping purposes.',
      },
      confidence: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Your confidence in the extracted values overall.',
      },
    },
    required: [
      'invoice_date',
      'vendor',
      'amount_excl_btw',
      'btw_rate',
      'btw_amount',
      'total_amount',
      'category',
      'confidence',
    ],
  },
};

function fileToContentBlock(filePath, mimeType) {
  const data = fs.readFileSync(filePath).toString('base64');
  if (mimeType === 'application/pdf') {
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data },
    };
  }
  return {
    type: 'image',
    source: { type: 'base64', media_type: mimeType, data },
  };
}

export async function extractInvoiceData(filePath, mimeType) {
  const fileBlock = fileToContentBlock(filePath, mimeType);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'record_invoice_data' },
    messages: [
      {
        role: 'user',
        content: [
          fileBlock,
          {
            type: 'text',
            text: `This is an invoice or receipt for a Dutch freelance business. Read it carefully and call record_invoice_data with the extracted fields.

Dutch BTW (VAT) rates are normally 21% (standard) or 9% (reduced, e.g. food, books). Some documents show 0% or are BTW-exempt (btw_rate: 0). If only the total is shown and BTW is not itemized, infer amount_excl_btw and btw_amount from the total and the most likely rate. Amounts must use "." as the decimal separator regardless of how they appear on the document.

Categorize the expense into exactly one of: Supplies, Rent, Salaries, Utilities, Marketing, Travel, Software. Pick the closest match.`,
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('Claude did not return structured invoice data');
  }
  return toolUse.input;
}
