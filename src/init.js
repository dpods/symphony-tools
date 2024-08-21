import { addSortableJs } from './utils/sortable.js';
import { initTokenAndAccountUtil } from './utils/tokenAndAccountUtil.js';
import { initFactsheet } from './utils/factsheet.js';
import { initPortfolio } from './portfolio.js';
import { log } from './utils/logger.js';

export function main() {
  addSortableJs();
  initTokenAndAccountUtil();
  initFactsheet();
  initPortfolio();
  log(
    "chrome.runtime available here ",
    typeof chrome.runtime.sendMessage == "function",
  );
}