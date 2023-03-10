const request = require('request');
const { createParser } = require("eventsource-parser");

// export type ChatGPTAgent = "user" | "system";

// export interface ChatGPTMessage {
//   role: ChatGPTAgent;
//   content: string;
// }

// export interface OpenAIStreamPayload {
//   model: string;
//   temperature: number;
//   messages:ChatGPTMessage[]
//   top_p: number;
//   frequency_penalty: number;
//   presence_penalty: number;
//   max_tokens: number;
//   stream: boolean;
//   n: number;
// }
const encoder = new TextEncoder();
const decoder = new TextDecoder();

exports.OpenAIStream = async function(payload) {
  let counter = 0;

  const options = {
    url: "https://openai.yaavi.me/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer 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`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  };

  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event) {
        if (event.type === "event") {
          const data = event.data;
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            // const text = json.choices[0].text;
            const text = json.choices[0].delta?.content || "";

            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // maybe parse error
            controller.error(e);
          }
        }
      }

      const req = request(options, (err, res, body) => {
        if (err) {
          controller.error(err);
        } else {
          controller.close();
        }
      });

      // OpenAI 的 SSE 响应可能会被分成多个块
      // 这个函数确保我们正确地读取这些块，并且为每个 SSE 事件流触发一个事件。
      const parser = createParser(onParse);
      req.on('data', (chunk) => {
        parser.feed(decoder.decode(chunk));
      });
      req.on('error', (err) => {
        controller.error(err);
      });
    },
  });

  return stream;
}
