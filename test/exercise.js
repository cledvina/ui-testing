const Nightmare = require('../xnightmare.js');
const assert = require('assert');
const config = require('../folio-ui.config.js');
const helpers = require('../helpers.js');

const user = helpers.namegen();

describe('Exercise users, inventory, checkout, checkin, settings ("test-exercise")', function () {
  this.timeout(Number(config.test_timeout));

  describe('Login > Update settings > Find user > Create inventory record > Create holdings record > Create item record > Checkout item > Confirm checkout > Checkin > Confirm checkin > Logout\n', () => {
    const nightmare = new Nightmare(config.nightmare);
    let userid = 'user';
    const uselector = "#list-users div[role='listitem']:nth-of-type(12) > a > div:nth-of-type(5)";
    let openLoans = null;
    const barcode = new Date().valueOf();
    const title = 'Soul station';
    const callno = 'SDA 32171';

    it(`should login as ${config.username}/${config.password}`, (done) => {
      nightmare
        .on('page', function (type = 'alert', message) {
          throw new Error(message);
        })
        .goto(config.url)
        .wait(Number(config.login_wait))
        .insert(config.select.username, config.username)
        .insert(config.select.password, config.password)
        .click('#clickable-login')
        .wait('#clickable-logout')
        .then((result) => { done(); })
        .catch(done);
    });
    it('should set patron scan ID to "User"', (done) => {
      nightmare
        .wait(config.select.settings)
        .click(config.select.settings)
        .wait('a[href="/settings/circulation"]')
        .wait(222)
        .click('a[href="/settings/circulation"]')
        .wait('a[href="/settings/circulation/checkout"]')
        .wait(222)
        .click('a[href="/settings/circulation/checkout"]')
        .wait('#username-checkbox')
        .wait(1000)
        .evaluate(() => {
          const list = document.querySelectorAll('[data-checked="true"]');
          list.forEach(el => (el.click()));
        })
        .wait(222)
        .click('#username-checkbox')
        .wait(222)
        .xclick('//button[.="Save"]')
        .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 555) // debugging
        .then((result) => { done(); })
        .catch(done);
    });
    it('should find an active user ', (done) => {
      nightmare
        .click('#clickable-users-module')
        .wait(2000)
        .click('#clickable-filter-active-Active')
        .wait(uselector)
        .evaluate(function (selector) {
          return document.querySelector(selector).title;
        }, uselector)
        .then(function (result) {
          userid = result;
          done();
          console.log(`          Found user ${userid}`);
        })
        .catch(done);
    });
    it(`should find current loans count for ${userid}`, (done) => {
      nightmare
        .click(`div[title="${userid}"]`)
        .wait('#clickable-viewcurrentloans')
        .wait(1999)
        .evaluate(function () {
          return document.querySelector('#clickable-viewcurrentloans').textContent;
        })
        .then(function (result) {
          const ol = result;
          openLoans = Number(ol.replace(/^(\d+).*/, '$1'));
          done();
          // console.log(`          Open loans: ${openLoans}`);
        })
        .catch(done);
    });
    it(`should find closed loans count for ${userid}`, (done) => {
      nightmare
        .evaluate(function () {
          return document.querySelector('#clickable-viewclosedloans').textContent;
        })
        .then(function (result) {
          const ol = result;
          openLoans = Number(ol.replace(/^(\d+).*/, '$1'));
          done();
          // console.log(`          Closed loans: ${openLoans}`);
        })
        .catch(done);
    });
    it('should create inventory record', (done) => {
      nightmare
        .click('#clickable-inventory-module')
        .wait(2222)
        .click('#clickable-newinventory')
        .wait('#input_instance_title')
        .insert('#input_instance_title', title)
        .wait(222)
        .click('#select_instance_type')
        .wait(111)
        .type('#select_instance_type', 'b')
        .click('#clickable-create-instance')
        .wait('#clickable-new-holdings-record')
        .then((result) => { done(); })
        .catch(done);
    });
    it('should create holdings record', (done) => {
      nightmare
        .click('#clickable-new-holdings-record')
        .wait('#additem_permanentlocation')
        .wait(1111)
        .type('#additem_permanentlocation', 'm')
        .insert('#additem_callnumber', callno)
        .click('#clickable-create-item')
        .wait('#clickable-new-item')
        .then((result) => { done(); })
        .catch(done);
    });
    it('should create item record', (done) => {
      nightmare
        .click('#clickable-new-item')
        .wait('#additem_materialType')
        .wait(1111)
        .click('#additem_materialType')
        .wait(111)
        .type('#additem_materialType', 's')
        .wait(111)
        .click('#additem_loanTypePerm')
        .wait(111)
        .type('#additem_loanTypePerm', 'cc')
        .wait(222)
        .insert('#additem_barcode', barcode)
        .wait(222)
        .click('#clickable-create-item')
        .then((result) => { done(); })
        .catch(done);
    });
    it(`should check out ${barcode} to ${userid}`, (done) => {
      nightmare
        .click('#clickable-checkout-module')
        .wait('#input-patron-identifier')
        .wait(2222)
        .evaluate(function () {
          const ph = document.querySelector('#input-patron-identifier').placeholder;
          if (!ph.match(/username/i)) {
            throw new Error(`Placeholder is not asking for Username! (${ph})`);
          }
        })
        .insert('#input-patron-identifier', userid)
        .click('#clickable-find-patron')
        .wait(function () {
          const err = document.querySelector('#patron-form div[class^="textfieldError"]');
          const yay = document.querySelector('#patron-form ~ div a > strong');
          if (err) {
            throw new Error(err.textContent);
          } else if (yay) {
            return true;
          } else {
            return false;
          }
        })
        .wait(222)
        .insert('#input-item-barcode', barcode)
        .wait(222)
        .click('#clickable-add-item')
        .wait(1111)
        .evaluate(function () {
          const sel = document.querySelector('div[class^="textfieldError"]');
          if (sel) {
            throw new Error(sel.textContent);
          }
        })
        .wait(222)
        .click('#section-item button')
        .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 555) // debugging
        .then((result) => { done(); })
        .catch(done);
    });
    it(`should find ${barcode} in ${userid}'s open loans`, (done) => {
      nightmare
        .click('#clickable-users-module')
        .wait('#input-user-search')
      // .click('#input-user-search ~ div button')
        .wait(222)
        .insert('#input-user-search', userid)
        .wait(`#list-users div[title="${userid}"]`)
        .click(`#list-users div[title="${userid}"]`)
        .wait('#clickable-viewcurrentloans')
        .click('#clickable-viewcurrentloans')
        .wait(function (barcode) {
          const element = document.evaluate(`id("list-loanshistory")//a[.="${barcode}"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          if (element.singleNodeValue) {
            return true;
          } else {
            return false;
          }
        }, barcode)
        .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 555) // debugging
        .then((result) => { done(); })
        .catch(done);
    });
    it(`should check in ${barcode}`, (done) => {
      nightmare
        .click('#clickable-checkin-module')
        .wait(222)
        .insert('#input-item-barcode', barcode)
        .wait(222)
        .click('#clickable-add-item')
        .wait('#list-items-checked-in')
        .evaluate(function () {
          const a = document.querySelector('div[title="Available"]');
          if (a === null) {
            throw new Error("Checkin did not return 'Available' status");
          }
        })
        .then((result) => {
          done();
        })
        .catch(done);
    });
    it(`should confirm ${barcode} in ${userid}'s closed loans`, (done) => {
      nightmare
        .click('#clickable-users-module')
        .wait('#input-user-search')
      // .click('#input-user-search ~ div button')
        .insert('#input-user-search', userid)
        .wait(`div[title="${userid}"]`)
        .click(`div[title="${userid}"]`)
        .wait('#clickable-viewclosedloans')
        .click('#clickable-viewclosedloans')
        .wait(function (barcode) {
          const element = document.evaluate(`id("list-loanshistory")//a[.="${barcode}"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          if (element.singleNodeValue) {
            return true;
          } else {
            return false;
          }
        }, barcode)
        .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 555) // debugging
        .then((result) => { done(); })
        .catch(done);
    });
    it('should logout', (done) => {
      nightmare
        .click('#clickable-logout')
        .wait(config.select.username)
        .end()
        .then((result) => { done(); })
        .catch(done);
    });
  });
});
