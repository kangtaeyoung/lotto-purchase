'use strict';

const { execSync } = require('child_process');
const core = require('@actions/core');
const { getNextLottoRound, LogLevel, LottoService } = require('@rich-automation/lotto');
const { chromium } = require('playwright');
 

(async () => {
  let lottoService = null;

  try {
    core.info('Installing Playwright dependencies...');
    execSync('pnpm exec playwright install chromium --with-deps');

    const count = parseInt(core.getInput('count', { required: false })) || 5;
    const id = core.getInput('id', { required: true });
    const pwd = core.getInput('pwd', { required: true });

    if (count < 1 || count > 5) {
      throw new Error("The 'count' input must be a number between 1 and 5.");
    }

    const round = getNextLottoRound();
    core.info(`Current lotto round: ${round}`);

    lottoService = new LottoService({
      headless: true,
      controller: chromium,
      logLevel: LogLevel.DEBUG,
    });
    core.info(`Signing in to the lotto service..., id: ${id}, pwd: ${pwd}, count: ${count}`);
    await lottoService.signIn(id, pwd);

    core.info(`Purchasing ${count} lotto ticket(s) for round ${round}...`);
    const numbersArray = await lottoService.purchase(count);

    core.info('Lotto tickets purchased successfully.');
    core.setOutput('numbersArray', JSON.stringify(numbersArray));
    core.setOutput('round', round);
 
 
    const response = await fetch('https://hooks.slack.com/services/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', {
      method: 'post',
      body: JSON.stringify({ "text": `로또 구매 완료 - 회차: ${round}, 번호: ${JSON.stringify(numbersArray)}`}),
      headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();
    core.info(`Slack: ${data}`);
    
  } catch (error) {
    core.setFailed(`Lotto purchase failed: ${error.message}`);
  } finally {
    if (lottoService) {
      await lottoService.destroy();
    }
  }
})();
