let fs = require('fs');
require('chromedriver');
let swd = require('selenium-webdriver');
let bldr = new swd.Builder();
let driver = bldr.forBrowser('chrome').build();

let cFile = process.argv[2];
let userToAdd = process.argv[3];

(async function () {
    try {
        await driver.manage().setTimeouts({
            implicit: 10000,
            pageload: 10000
        })
        //used iife bcoz await is not allowed in top level code
        let contents = await fs.promises.readFile(cFile, 'utf-8');
        console.log(contents );
        let obj = JSON.parse(contents);
        let user = obj.user;
        let pwd = obj.pwd;
        let url = obj.url;

        await driver.get(url);
        let userele = await driver.findElement(swd.By.css('#input-1'));
        let pwdele = await driver.findElement(swd.By.css('#input-2'));

        await userele.sendKeys(user);
        await pwdele.sendKeys(pwd);

        let btnlogin = await driver.findElement(swd.By.css(".auth-button"));
        await btnlogin.click();

        let btnAdmin = await driver.findElement(swd.By.css('a[data-analytics=NavBarProfileDropDownAdministration]'));
        // let adm=await btnAdmin.driver.findElement(swd.By.css('a[NavBarProfileDropDownAdministration]'));
        let admURL = await btnAdmin.getAttribute('href');
        await driver.get(admURL);

        let manageContests = await driver.findElements(swd.By.css('ul.nav-tabs li'));
        await manageContests[1].click();

        let cURL = await driver.getCurrentUrl();

        let qidx = 0;
        let quesEle = await getquesEle(cURL, qidx);
        // console.log(quesEle);
        while (quesEle !== undefined) {
            await handleQuestion(quesEle);
            qidx++;
            quesEle = await getquesEle(cURL, qidx);
        }
    } catch (err) {
        console.log(err);
    }
})();

async function getquesEle(cURL, qidx) {
    await driver.get(cURL);
    let pageidx = parseInt(qidx / 10);  //convert decimal to integer e.g. (0.3 -> 0)
    qidx = qidx % 10;

    let paginationBtns = await driver.findElements(swd.By.css('.pagination li'));
    let nextPageBtn = paginationBtns[paginationBtns.length - 2];
    let classOnNextPageBtn = await nextPageBtn.getAttribute('class');
    for (let i = 0; i < pageidx; i++) {
        if (classOnNextPageBtn !== 'disabled') {
            await nextPageBtn.click();

            paginationBtns = await driver.findElements(swd.By.css('.pagination li'));
            nextPageBtn = paginationBtns[paginationBtns.length - 2];
            classOnNextPageBtn = await nextPageBtn.getAttribute('class');
        } else {
            return undefined;
        }
    }

    let quesElements = await driver.findElements(swd.By.css('.backbone.block-center'));
    if (qidx < quesElements.length) {
        return quesElements[qidx];
    } else {
        return undefined;
    }
}

async function handleQuestion(quesEle) {
       //moderator tab,moderator text box,save btn
      let qURL=await quesEle.getAttribute('href');
      console.log(qURL);
      await quesEle.click();
       //wait for last tag to fill/seen on website and then go to moderator
      await driver.wait(swd.until.elementLocated(swd.By.css('span.tag')));

      let moderatorTab= await driver.findElement(swd.By.css('li[data-tab=moderators]'));
      await moderatorTab.click();

      let moderatorTextBox= await driver.findElement(swd.By.css('#moderator'));
      await moderatorTextBox.sendKeys(userToAdd);
      await moderatorTextBox.sendKeys(swd.Key.ENTER);

      let Savebtn= await driver.findElement(swd.By.css('.save-challenge'));
      await Savebtn.click();
       
    }