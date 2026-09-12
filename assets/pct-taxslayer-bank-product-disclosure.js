/* TaxSlayer-provided bank-product disclosure. The legal body is retained
   verbatim and shared by Owner and personalized Agent intake pages. */
(function () {
  'use strict';

  const sourceVersion = 'TAXSLAYER_PROVIDED_UNDATED_PAGE_1';
  const title = 'CONSENT TO USE AND DISCLOSER OF THE TAX RETURN';
  const pageLabel = 'Page 1';
  const preparerLabel = 'Name of tax preparer:';
  const legalParagraphs = Object.freeze([
    'Federal law requires this consent form to be provided to you (“you” refers to each taxpayer, if more than one). Unless authorized by law, we cannot use or disclose your tax return information for purposes other than the preparation and filing of your tax return.',
    'You are not required to complete this form. Because our ability to disclose your tax return information to another institution affects the service(s) that we provide to you and its (their) cost, we may decline to provide you with the tax return preparation services or change the terms (including the cost) of the tax return preparation services that we provide to you. Your consent is valid for the amount of time that you specify. If you do not specify the duration of your consent, your consent is valid for one year.',
    'For your convenience, we have entered into agreements with a bank to provide qualifying taxpayers with the opportunity to apply for a (bank product) Refund Transfer (RT) and/or Loan via Electronic Refund Check or Electronic Refund Deposit. In order to provide you with the opportunity to apply for one of these Products or Services, we must disclose all of your tax return information to our partnered financial institution.',
    'By signing below, you (including each of you if there is more than one taxpayer) authorize us to disclose to financial institution we partnered with all your tax return information.',
    'By signing below, you (including each of you if there is more than one taxpayer) authorize us to use the information you provided to us during the preparation of your tax return to determine whether to present you with the opportunity to apply for a bank product (described above) and services.'
  ]);
  const blank = '_______________________________________________';
  const jointTaxpayerBlank = '__________________________________________';
  const canonicalText = Object.freeze([
    title,
    pageLabel,
    preparerLabel + ' ' + blank,
    ...legalParagraphs,
    'Name of Taxpayer ' + blank,
    'Taxpayer Signature ______________________________ Date __________',
    'Name of joint Taxpayer ' + jointTaxpayerBlank,
    'Joint Taxpayer Signature _________________________ Date __________'
  ].join('\n\n'));

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }
  function populatedValue(value) {
    const text = String(value || '').trim();
    return text ? escapeHtml(text) : blank;
  }
  function render({preparerName = '', taxpayerName = '', jointTaxpayerName = '', joint = false} = {}) {
    const paragraphs = legalParagraphs.map(paragraph => '<p>' + escapeHtml(paragraph) + '</p>').join('');
    const jointField = joint ? '<p>Name of joint Taxpayer <strong>' + populatedValue(jointTaxpayerName) + '</strong></p>' : '';
    return '<div class="pct-bank-consent" data-taxslayer-bank-product-disclosure>' +
      '<div class="kicker">' + escapeHtml(title) + '</div><p class="small">' + escapeHtml(pageLabel) + '</p>' +
      '<p>' + escapeHtml(preparerLabel) + ' <strong>' + populatedValue(preparerName) + '</strong></p>' +
      paragraphs +
      '<p>Name of Taxpayer <strong>' + populatedValue(taxpayerName) + '</strong></p>' +
      '<p>Taxpayer Signature ______________________________ Date __________</p>' +
      jointField +
      (joint ? '<p>Joint Taxpayer Signature _________________________ Date __________</p>' : '') +
      '</div>';
  }

  window.PCTTaxSlayerBankProductDisclosure = Object.freeze({
    sourceVersion,
    canonicalText,
    title,
    pageLabel,
    render
  });
}());
