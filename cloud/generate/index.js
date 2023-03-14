// 云函数入口文件
const cloud = require("wx-server-sdk");
const request = require("request");
const { createParser } = require("eventsource-parser");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database()
const _ = db.command

const promptObj = {
  直接发给chatgpt: "",
  英文邮件:
    "Generate a business email in UK English that is friendly, but still professional and appropriate for the workplace.The topic is",
  中文邮件:
    "Generate a business email in Simplified Chinese  that is friendly, but still professional and appropriate for the workplace.The topic is",
  说了啥: "用一段话详略得当总结这段聊天内容",
  老胡生成器:
    "按照下面模板，写篇文章: '近期互联网上出现了___, 老胡看到___,知道大家很___,老胡忍不住啰嗦几句,虽然___, 确实存在部分___, 但是___, 最后老胡呼吁___。'，内容是",
  写个正则: "写个正则表达式",
  英语作文: "写一个符合雅思7分要求的100个单词的小作文，用到下面的单词",
  修改英语语法: "帮我改一下下面这段话的英语语法，符合雅思七分的要求",
  编日报: "帮我写个工作的日报，内容+列表的形式",
  写情书: "帮我写个正式的情书，根据下面的描述",
  哄媳妇睡觉小故事: "帮我生成一个500字的有意思的小故事，用来哄媳妇睡觉",
  小红书文案:
    "帮我扩展一下这段文字，起一个能吸引眼球的标题，内容润色成小红书的风格，每行开头都用不同的emoji:",
};

// const encoder = new TextEncoder();
const decoder = new TextDecoder();

let counter = 0;
let steamStr = "";
const onParse = (event) => {
  if (event.type === "event") {
    const data = event.data;
    // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
    if (data === "[DONE]") {
      return;
    }
    try {
      const json = JSON.parse(data);
      // const text = json.choices[0].text;
      const text =
        (json.choices[0].delta && json.choices[0].delta.content) || "";

      if (counter < 2 && (text.match(/\n/) || []).length) {
        // this is a prefix character (i.e., "\n\n"), do nothing
        return;
      }
      steamStr += text;
      // console.log(Date.now(), text);
      counter++;
    } catch (e) {
      // maybe parse error
      // console.log("error", e);
    }
  }
};

const parser = createParser(onParse);

const reqOpenAI = function (payload) {
  counter = 0;
  steamStr = "";

  return new Promise((resolve, reject) => {
    const options = {
      url: "https://openai.yaavi.me/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    };

    const req = request(options, (err, res, body) => {
      if (err) {
        // console.log("err");
        reject(err);
      } else {
        // console.log("!err");
        // console.log("steamStr", steamStr);
        resolve({ steamStr });
      }
    });

    req.on("data", (chunk) => {
      parser.feed(decoder.decode(chunk));
    });
    req.on("error", (err) => {
      // console.log("error", err);
    });
  });
};

const checkMsg = async (content, openid, version = 2) => {
  // console.log('checkMsg', content);
  try {
    const data = await cloud.openapi.security.msgSecCheck({
      openid,
      content,
      version, // 场景枚举值（1 资料；2 评论；3 论坛；4 社交日志）
      scene: 2,
    });
    if (data)
    // console.log('checkMsg', data);
    return data.result;
  } catch (err) {
    // console.log('checkMsg', err);
    return err;
  }
};

// ------- 云函数入口函数 --------
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const lang = event.lang || "";
  const text = event.text || "";

  if (!text) {
    return {
      error: true,
      context: "请填写内容"
    };
  }

  // ---- 存储提问内容数据 -----
  let _id
  try {
    const dbResData = await db.collection('task').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        _openid: wxContext.OPENID,
        lang,
        text,
        createTime: db.serverDate(),
        done: false
      }
    })
    _id = dbResData._id
  } catch (e) {
    return {
      error: true,
      context: "写入数据库失败"
    }
  }

  // --- 查询剩余次数 ---
  try {
    const balanceData = await db.collection('balance').doc(wxContext.OPENID).get()
    // console.log(balanceData)
    if (balanceData.data.times <= 0) {
      return {
        error: true,
        type: 1, // 1 充值
        context: '服务次数已用完，可以进入个人中心购买哦。'
      }
    }
  } catch(e) {
    await db.collection('balance').add({
      data: {
        _id: wxContext.OPENID,
        createTime: db.serverDate(),
        times: 5,
        used: 0
      }
    })
  }

  // ---- 校验文本是否合规 -----
  const result = await checkMsg(text, wxContext.OPENID)

  db.collection('task').doc(_id).update({
    data: {
      reqSuggest: result
    }
  })

  if (result.suggest !== 'pass') {
    return {
      error: true,
      context: '内容审核未通过，请换个说法吧。'
    }
  }

  // ------ 创建发送文本信息 ------
  const prompt = `${promptObj[lang] ? promptObj[lang] + ":\n" : ""}${text}${
    text.slice(-1) === "." ? "" : "."
  }`;

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

  // ----- 请求openai ------
  try {
    const { steamStr } = await reqOpenAI(payload);
    if (!steamStr) {
      return {
        error: true,
        context: '没回复内容呢～'
      }
    }
    const result = await checkMsg(steamStr, wxContext.OPENID, 1)
    // --- 扣减次数 ---
    db.collection('balance').doc(wxContext.OPENID).update({
      data: {
        times: _.inc(-1),
        used: _.inc(1) || 1
      }
    })

    // ----- OK -----
    db.collection('task').doc(_id).update({
      data: {
        result: steamStr,
        resSuggest: result,
        done: true
      }
    })
    if (result.suggest !== 'pass') {
      return {
        error: true,
        context: '小跟班回复涉及敏感内容，已不展示。'
      }
    }
    return {
      steamStr,
      event,
    };
  } catch (e) {
    return {
      error: true,
      context: "网络出了点小问题"
    };
  }
};
