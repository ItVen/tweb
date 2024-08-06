// src/pages/pageBotDemo.ts

import blurActiveElement from "../helpers/dom/blurActiveElement";
import loadFonts from "../helpers/dom/loadFonts";
import rootScope from "../lib/rootScope";
import Page from "./page";
import ListenerSetter from "../helpers/listenerSetter";
import { ReplyMarkup } from "../layer";
const BOT = "pepeboost_sol09_bot";

const managers = rootScope.managers;
const { apiUpdatesManager } = managers;
let listenerSetter = new ListenerSetter();
let currentStep = 0;
const onFirstMount = async () => {
  rootScope.managers.appStateManager.pushToState("authState", {
    _: "botDemo",
  });
  page.pageEl.style.display = "";

  blurActiveElement();

  const outputText = document.createElement("div");
  outputText.className = "output-text";
  const button = document.createElement("button");
  button.textContent = "账户信息";
  button.className = "bot-custom-button";

  button.addEventListener("click", async () => {
    try {
      await handleBotInteraction(outputText, currentStep);
    } catch (error) {
      console.log(error);
    }
  });

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "bot-button-container";
  buttonContainer.appendChild(button);
  buttonContainer.appendChild(outputText);

  page.pageEl.appendChild(buttonContainer);
  await addListener(outputText);

  return Promise.all([
    loadFonts(),
    "requestVideoFrameCallback" in HTMLVideoElement.prototype
      ? Promise.resolve()
      : import("../helpers/dom/requestVideoFrameCallbackPolyfill"),
  ]);
};

const page = new Page("page-bot-demo", false, onFirstMount);

export default page;

const initBotPeerId = async (): Promise<number> => {
  let botUser = await managers.appUsersManager.resolveUsername(BOT);
  return botUser.id as number;
};

const sendMessage = async (message?: string, replyMarkup?: ReplyMarkup) => {
  let botPeerId = await initBotPeerId();
  await managers.appMessagesManager.sendText({
    peerId: botPeerId,
    text: message,
    replyMarkup,
  });
};

const handleBotInteraction = async (
  outputText: HTMLDivElement,
  step: number,
  buttonMessage?: string
) => {
  let message = "";
  switch (step) {
    case 0:
      message = "/menu";
      break;
    default:
      message = "Unknown step";
  }
  await sendMessage(message);
  apiUpdatesManager.subscribeToChannelUpdates(await initBotPeerId());
  outputText.textContent = "Message sent successfully!";
};

const addListener = async (outputText: HTMLDivElement) => {
  let botPeerId = await initBotPeerId();
  listenerSetter.add(rootScope)("dialogs_multiupdate", (dialogs) => {
    if (!dialogs.has(botPeerId)) {
      return;
    }
    for (const [peerId, { dialog, topics }] of dialogs) {
      let { topMessage } = dialog;
      let { fromId, message, reply_markup, mid } = topMessage;
      if (fromId !== botPeerId) {
        continue;
      } 
      console.log("topMessage", topMessage);
      outputText.textContent = message;
      handleBotButtons(reply_markup, peerId, mid);
    }
  });
};

const handleBotButtons = (
  replyMarkup: ReplyMarkup,
  peerId: number,
  messageMid: number
) => {
  let replyMarkupRows =
    replyMarkup?._ === "replyInlineMarkup" && replyMarkup.rows;
  if (replyMarkupRows) {
    replyMarkupRows = replyMarkupRows.filter((row) => row.buttons.length);
  }

  replyMarkupRows.forEach((row, idx, arr) => {
    const buttons = row.buttons;
    buttons.forEach(async (button, idx, arr) => {
      if (button.text === `💳 钱包`) {
        rootScope.managers.appInlineBotsManager.callbackButtonClick(
          peerId,
          messageMid,
          button
        );
        console.log("button", { peerId, messageMid, button });
      }
    });
  });
};
