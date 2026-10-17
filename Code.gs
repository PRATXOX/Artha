/**
 * Estates Artha - lead receiver.
 * Saves every lead to a Google Sheet, emails you, optionally auto-replies to the lead
 * and optionally pings you on WhatsApp (Cloud API). See README.md for setup.
 */
const CONFIG = {
  OWNER_EMAIL: 'you@yourdomain.com',      // comma-separate for several people
  SHEET_NAME: 'LeadsWeb',
  BRAND: 'Estates Artha',
  PHONE: '+91 99999 99999',
  SEND_AUTOREPLY: true,                   // email the lead a confirmation (only if they gave an email)
  WHATSAPP_CLOUD: {                       // optional, see README section 3C
    ENABLED: false,
    TOKEN: '',                            // permanent access token
    PHONE_NUMBER_ID: '',
    TO: '919999999999',                   // your number that receives the alert
    TEMPLATE: 'new_lead',                 // approved template with 3 body variables: name, phone, project
    LANG: 'en'
  }
};
const HEADERS = ['Date/Time', 'Name', 'Phone', 'Email', 'Project', 'Configuration', 'Source', 'UTM', 'Page'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d.name || !d.phone) return out({ ok: false, error: 'missing fields' });
    getSheet().appendRow([d.dateTime || new Date(), d.name, d.phone, d.email || '', d.project, d.config, d.source, d.utm || '', d.page || '']);
    notifyOwner(d);
    if (CONFIG.SEND_AUTOREPLY && d.email) autoReply(d);
    if (CONFIG.WHATSAPP_CLOUD.ENABLED) whatsappPing(d);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() { return out({ ok: true, message: 'Lead endpoint is live' }); }

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange('C:C').setNumberFormat('@'); // keep +91 numbers as text
  }
  return sh;
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function notifyOwner(d) {
  const wa = 'https://wa.me/' + String(d.phone).replace(/\D/g, '');
  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    subject: 'New lead: ' + d.name + ' - ' + d.project,
    htmlBody: '<h3>New lead from the website</h3><table cellpadding="4">' +
      [['Name', d.name], ['Phone', d.phone], ['Email', d.email], ['Project', d.project], ['Configuration', d.config], ['Source', d.source], ['Time', d.dateTime], ['Campaign', d.utm]]
        .map(r => '<tr><td><b>' + r[0] + '</b></td><td>' + esc(r[1]) + '</td></tr>').join('') +
      '</table><p><a href="' + wa + '">Open WhatsApp chat</a> &nbsp; <a href="tel:' + esc(d.phone) + '">Call now</a></p>'
  });
}

function autoReply(d) {
  MailApp.sendEmail({
    to: d.email,
    subject: 'Thanks for your interest in ' + d.project,
    name: CONFIG.BRAND,
    htmlBody: '<p>Hi ' + esc(d.name.split(' ')[0]) + ',</p><p>Thank you for enquiring about <b>' + esc(d.project) +
      '</b>. Our property expert will call you shortly on ' + esc(d.phone) + '.</p><p>Need us sooner? Call ' + CONFIG.PHONE +
      '.</p><p>Regards,<br>' + CONFIG.BRAND + '</p>'
  });
}

function whatsappPing(d) {
  const c = CONFIG.WHATSAPP_CLOUD;
  UrlFetchApp.fetch('https://graph.facebook.com/v20.0/' + c.PHONE_NUMBER_ID + '/messages', {
    method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + c.TOKEN }, muteHttpExceptions: true,
    payload: JSON.stringify({
      messaging_product: 'whatsapp', to: c.TO, type: 'template',
      template: { name: c.TEMPLATE, language: { code: c.LANG }, components: [{ type: 'body', parameters: [{ type: 'text', text: d.name }, { type: 'text', text: d.phone }, { type: 'text', text: d.project }] }] }
    })
  });
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Run once from the editor to test the sheet + email without the website. */
function testLead() {
  doPost({ postData: { contents: JSON.stringify({ name: 'Test Lead', phone: '+919876543210', email: CONFIG.OWNER_EMAIL, project: 'Grand Residency', config: '3 BHK', source: 'Manual test', dateTime: new Date().toLocaleString('en-IN') }) } });
}
