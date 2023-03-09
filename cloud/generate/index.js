// 云函数入口文件
const cloud = require('wx-server-sdk')
const { Configuration, OpenAIApi } = require("openai");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  console.log({
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  })

  const lang = event.lang || ""
  const text = event.text || "写个正则表达式"

  let promptObj = {
    "直接发给chatgpt":"",
    "英文邮件": "Generate a business email in UK English that is friendly, but still professional and appropriate for the workplace.The topic is",
    "中文邮件": "Generate a business email in Simplified Chinese  that is friendly, but still professional and appropriate for the workplace.The topic is",
    "说了啥":"用一段话详略得当总结这段聊天内容",
    "老胡生成器":"按照下面模板，写篇文章: '近期互联网上出现了___, 老胡看到___,知道大家很___,老胡忍不住啰嗦几句,虽然___, 确实存在部分___, 但是___, 最后老胡呼吁___。'，内容是",
    "写个正则":"写个正则表达式",
    "根据单词写个英语作文":"写一个符合雅思7分要求的100个单词的小作文，用到下面的单词",
    "修改英语语法":"帮我改一下下面这段话的英语语法，符合雅思七分的要求",
    "编日报":"帮我写个工作的日报，内容+列表的形式",
    "哄媳妇睡觉小故事":"帮我生成一个500字的有意思的小故事，用来哄媳妇睡觉",
    "小红书文案生成器":"帮我扩展一下这段文字，起一个能吸引眼球的标题，内容润色成小红书的风格，每行开头都用不同的emoji:"
  }

  const prompt = `${promptObj[lang] ? promptObj[lang] + ":\n" : ""}${text}${text.slice(-1) === "." ? "" : "."}`

  const payload = {
    // model:"text-chat-davinci-002-20221122",
    // model: "text-davinci-003",
    // model:"text-curie-001",
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    // prompt,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 800,
    stream: true,
    n: 1,
  };

  const configuration = new Configuration({
    apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createChatCompletion(payload);

  console.log(completion.data);
  console.log(completion.data.choices[0].message);

  return completion
}