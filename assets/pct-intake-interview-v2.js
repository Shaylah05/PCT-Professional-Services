/*
 * PCT Intake Interview v2 — declarative definitions only.
 * This file is intentionally not loaded by a production page until the future
 * v2 renderer and matching validation are introduced for both public intakes.
 */
(function attachPCTIntakeInterviewV2(window) {
  'use strict';

  const VERSION = 'pct-intake-2026-v2';
  const freeze = value => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.getOwnPropertyNames(value).forEach(key => freeze(value[key]));
    return Object.freeze(value);
  };

  const definition = {
    version: VERSION,
    narrativeMaxLength: 12000,
    narrativeHelper: {
      heading: 'TELL US IN YOUR OWN WORDS',
      text: 'Your answer helps your preparer understand your situation and may reduce the need for follow-up questions later.'
    },
    questions: [
      {
        questionId: 'dependent_relationship_context',
        questionVersion: VERSION,
        category: 'DEPENDENT_RELATIONSHIP',
        topic: 'Dependent relationship clarification',
        questionText: 'Please describe your relationship with this dependent and your role in caring for them during the year.',
        helperText: 'Share the facts in your own words so your preparer can understand the relationship.',
        requiredWhenShown: true,
        subjectType: 'DEPENDENT',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'dependentDetails[].relationship', operator: 'clarificationRequired', values: ['other', 'unclear']}, {stateKey: 'phase17Interview.dependentFacts[].relationship', operator: 'clarificationRequired'}], notes: 'Show only when the existing structured relationship needs clarification; do not show for a routine son/daughter relationship.'},
        notesCategory: 'Dependent — Relationship'
      },
      {
        questionId: 'dependent_residency',
        questionVersion: VERSION,
        category: 'DEPENDENT_RESIDENCY',
        topic: 'Dependent residency',
        questionText: 'Please describe where this dependent lived during the year, including approximately how long they stayed at each home or location.',
        helperText: 'Include regular and temporary living arrangements.',
        requiredWhenShown: true,
        subjectType: 'DEPENDENT',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'dependentDetails[].monthsLived', operator: 'lessThan', value: 12}, {stateKey: 'dependentDetails[].temporaryAbsence', operator: 'equalsAny', values: ['YES', 'UNSURE']}, {stateKey: 'phase17Interview.dependentFacts[].monthsLived', operator: 'lessThan', value: 12}], notes: 'Also show when an existing structured residency answer indicates another home, an inconsistency, or uncertainty.'},
        notesCategory: 'Dependent — Living arrangement'
      },
      {
        questionId: 'dependent_temporary_absence',
        questionVersion: VERSION,
        category: 'DEPENDENT_RESIDENCY',
        topic: 'Temporary absence',
        questionText: 'Please explain why this dependent was away, where they stayed, and approximately how long the absence lasted.',
        helperText: 'Examples may include school, medical care, military service, or another temporary reason.',
        requiredWhenShown: true,
        subjectType: 'DEPENDENT',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'dependentDetails[].temporaryAbsence', operator: 'equals', value: 'YES'}, {stateKey: 'phase17Interview.dependentFacts[].temporaryAbsence', operator: 'equals', value: 'YES'}], notes: 'Show only when a temporary absence is affirmatively indicated.'},
        notesCategory: 'Dependent — Temporary absence'
      },
      {
        questionId: 'dependent_support_context',
        questionVersion: VERSION,
        category: 'DEPENDENT_SUPPORT',
        topic: 'Dependent support',
        questionText: "Please describe who provided this dependent's main support during the year and what that support included.",
        helperText: 'You can include housing, food, childcare, medical care, or other major support.',
        requiredWhenShown: true,
        subjectType: 'DEPENDENT',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'dependentDetails[].supportDetails', operator: 'clarificationRequired'}, {stateKey: 'phase17Interview.dependentFacts[].support', operator: 'clarificationRequired'}], notes: 'Show when another person supplied substantial support, the provider is unclear, the taxpayer is unsure, or structured support facts conflict.'},
        notesCategory: 'Dependent — Support'
      },
      {
        questionId: 'dependent_possible_claimant',
        questionVersion: VERSION,
        category: 'DEPENDENT_CLAIMANT',
        topic: 'Possible other claimant',
        questionText: 'Please describe anyone else who may believe they can claim this dependent and why.',
        helperText: 'Your preparer may need to ask follow-up questions after reviewing the information.',
        requiredWhenShown: true,
        subjectType: 'DEPENDENT',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'dependentDetails[].competingClaimant', operator: 'equalsAny', values: ['YES', 'UNSURE']}, {stateKey: 'phase17Interview.dependentFacts[].competingClaimant', operator: 'equalsAny', values: ['YES', 'UNSURE']}], notes: 'Show only for an affirmative or uncertain other-claimant response.'},
        notesCategory: 'Dependent — Possible claimant'
      },
      {
        questionId: 'dependent_custody_arrangement',
        questionVersion: VERSION,
        category: 'DEPENDENT_CUSTODY',
        topic: 'Custody or shared parenting',
        questionText: 'Please describe the parenting, custody, or living arrangement for this dependent during the year.',
        helperText: 'Include any regular schedule or agreement that affected where the dependent stayed.',
        requiredWhenShown: true,
        subjectType: 'DEPENDENT',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'dependentDetails[].custodyDetails', operator: 'nonEmpty'}, {stateKey: 'dependentDetails[].competingClaimant', operator: 'equalsAny', values: ['YES', 'UNSURE']}, {stateKey: 'phase17Interview.dependentFacts[].custodyDetails', operator: 'nonEmpty'}], notes: 'Show when shared custody, multiple homes, another parent or guardian, or another structured fact needs clarification.'},
        notesCategory: 'Dependent — Custody'
      },
      {
        questionId: 'hoh_household_members',
        questionVersion: VERSION,
        category: 'HOUSEHOLD',
        topic: 'Household members',
        questionText: 'Please describe who lived in your home during the year and your relationship to each person.',
        helperText: 'Include anyone who lived with you regularly, even if you are not claiming them as a dependent.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'filingStatus', operator: 'equalsAny', values: ['hoh', 'HOH']}, {stateKey: 'phase17Credits_headOfHousehold', operator: 'equalsAny', values: ['YES', 'UNSURE']}], notes: 'Show when Head of Household is selected, considered, or uncertain; this gathers facts and does not determine filing status.'},
        notesCategory: 'Household — Members'
      },
      {
        questionId: 'hoh_household_expenses',
        questionVersion: VERSION,
        category: 'HOUSEHOLD_EXPENSES',
        topic: 'Household expenses',
        questionText: 'Please describe the main costs of keeping up your home and which of those expenses you paid.',
        helperText: 'Examples include rent or mortgage, utilities, food consumed in the home, property-related costs, and other household expenses.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'filingStatus', operator: 'equalsAny', values: ['hoh', 'HOH']}, {stateKey: 'phase17Credits_headOfHousehold', operator: 'equalsAny', values: ['YES', 'UNSURE']}], notes: 'Show when Head of Household is selected, considered, or uncertain; this gathers facts and does not determine filing status.'},
        notesCategory: 'Household — Expenses'
      },
      {
        questionId: 'marital_living_arrangement',
        questionVersion: VERSION,
        category: 'FILING_STATUS',
        topic: 'Marital or separation circumstances',
        questionText: 'Please describe your marital and living situation during the year, including any period when you and your spouse lived apart.',
        helperText: 'Include approximate dates when your living arrangements changed.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'filingStatus', operator: 'equalsAny', values: ['mfs', 'MFS', 'hoh', 'HOH']}, {stateKey: 'phase17General_filingStatusUncertain', operator: 'equalsAny', values: ['YES', 'UNSURE']}], notes: 'Also show when separation or a living arrangement with a spouse needs clarification.'},
        notesCategory: 'Filing status — Marital facts'
      },
      {
        questionId: 'education_student_context',
        questionVersion: VERSION,
        category: 'EDUCATION',
        topic: 'Education circumstances',
        questionText: "Please tell us about the student's enrollment and education expenses for the year, including who paid the expenses and whether scholarships, grants, employer assistance, or other education assistance was received.",
        helperText: 'Include the school, enrollment period, and any details that may help your preparer understand the amounts shown on your education documents.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ALL', conditions: [{stateKey: 'phase17Credits_educationCredit', operator: 'equalsAny', values: ['YES', 'UNSURE']}, {stateKey: 'educationContextRequired', operator: 'equals', value: true}], notes: 'Show only when education is selected and existing structured facts indicate additional context is needed.'},
        notesCategory: 'Education — Enrollment and costs'
      },
      {
        questionId: 'education_document_difference',
        questionVersion: VERSION,
        category: 'EDUCATION',
        topic: 'Education document difference',
        questionText: 'Please explain anything about the tuition, payments, scholarships, or education documents that may not be clear from the forms you received.',
        helperText: 'Your preparer may request additional documentation.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'educationAmountDiffersFrom1098T', operator: 'equals', value: true}, {stateKey: 'educationDocumentMissing', operator: 'equals', value: true}, {stateKey: 'educationAidInformation', operator: 'clarificationRequired'}], notes: 'Show only when the taxpayer reports a difference, a missing document, or an inconsistency.'},
        notesCategory: 'Education — Document reconciliation'
      },
      {
        questionId: 'business_activity_context',
        questionVersion: VERSION,
        category: 'BUSINESS_ACTIVITY',
        topic: 'Self-employment business activity',
        questionText: 'Please describe the work or business activity you performed during the year.',
        helperText: 'Tell us what you did, what type of customers you served generally, and how the business earned income.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'seIncome', operator: 'greaterThan', value: 0}, {stateKey: 'phase17ScheduleC_businessSelected', operator: 'equals', value: 'YES'}], notes: 'Show when self-employment or business activity is selected.'},
        notesCategory: 'Business — Activity'
      },
      {
        questionId: 'business_income_context',
        questionVersion: VERSION,
        category: 'BUSINESS_INCOME',
        topic: 'Business income or payment methods',
        questionText: 'Please describe how you were paid for this work and how you kept track of income that may not have been reported on a tax form.',
        helperText: 'This may include cash, payment apps, checks, invoices, deposits, or other payment methods.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ALL', conditions: [{stateKey: 'seIncome', operator: 'greaterThan', value: 0}, {stateKey: 'businessIncomeContextRequired', operator: 'equals', value: true}], notes: 'Show when self-employment is selected and cash, non-form income, payment methods, or totals need clarification.'},
        notesCategory: 'Business — Income sources'
      },
      {
        questionId: 'business_cash_income',
        questionVersion: VERSION,
        category: 'BUSINESS_INCOME',
        topic: 'Cash income',
        questionText: 'Please describe the cash payments you received, what the payments were for, and how you recorded or tracked them.',
        helperText: 'Your preparer may request records that help support the amounts.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'businessCashIncome', operator: 'greaterThan', value: 0}, {stateKey: 'businessCashIncomeIndicated', operator: 'equals', value: true}], notes: 'Show only when existing facts indicate cash income.'},
        notesCategory: 'Business — Cash income'
      },
      {
        questionId: 'business_recordkeeping',
        questionVersion: VERSION,
        category: 'BUSINESS_RECORDS',
        topic: 'Business recordkeeping',
        questionText: 'Please describe how you kept track of your business income and expenses during the year.',
        helperText: 'Examples include bank statements, receipts, bookkeeping software, spreadsheets, invoices, or written logs.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'phase17ScheduleC_recordkeeping', operator: 'equalsAny', values: ['NO', 'UNSURE']}, {stateKey: 'businessRecordkeeping', operator: 'clarificationRequired'}], notes: 'Do not show when existing structured records information is clear and internally consistent.'},
        notesCategory: 'Business — Records'
      },
      {
        questionId: 'business_expense_context',
        questionVersion: VERSION,
        category: 'BUSINESS_EXPENSES',
        topic: 'Business expense clarification',
        questionText: 'Please explain the business purpose of the expenses that may need additional clarification.',
        helperText: 'Describe how the expense related to the work or business you performed.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'businessExpenseClarificationRequired', operator: 'equals', value: true}, {stateKey: 'businessExpenseCategories', operator: 'hasUnusualValue'}], notes: 'Show when an unusual expense category, an unclear business-purpose connection, or preparer clarification is indicated.'},
        notesCategory: 'Business — Expenses'
      },
      {
        questionId: 'missing_tax_document',
        questionVersion: VERSION,
        category: 'INCOME_RECONCILIATION',
        topic: 'Missing or delayed tax document',
        questionText: 'Please describe any tax document or income information you are still waiting for, including what you expect to receive and from whom.',
        helperText: 'Your preparer may need the document before completing the return.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'missingTaxDocNotes', operator: 'nonEmpty'}, {stateKey: 'allTaxDocsConfirmed', operator: 'notEquals', value: 'yes'}, {stateKey: 'expectedIncomeFormStatus', operator: 'equalsAny', values: ['DELAYED', 'UNCLEAR']}], notes: 'Show when a document is missing, tax documents are not confirmed, or expected income information is delayed or unclear.'},
        notesCategory: 'Income — Missing documents'
      },
      {
        questionId: 'income_inconsistency',
        questionVersion: VERSION,
        category: 'INCOME_RECONCILIATION',
        topic: 'Income inconsistency',
        questionText: 'Please explain anything about your income for the year that may not be clear from the tax forms or information you provided.',
        helperText: 'Include any income source, amount, or situation you think your preparer should understand.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'incomeInformationUnclear', operator: 'equals', value: true}, {stateKey: 'incomeFacts', operator: 'materialInconsistency'}], notes: 'Show only when existing intake answers create a material inconsistency or the taxpayer identifies unclear income information.'},
        notesCategory: 'Income — Reconciliation'
      },
      {
        questionId: 'marketplace_household_changes',
        questionVersion: VERSION,
        category: 'MARKETPLACE',
        topic: 'Marketplace coverage changes',
        questionText: 'Please describe any changes in household members, income, address, or Marketplace coverage during the year that may need explanation.',
        helperText: 'Upload Form 1095-A if available.',
        requiredWhenShown: true,
        subjectType: 'RETURN',
        trigger: {mode: 'ALL', conditions: [{stateKey: 'marketplaceAwareness', operator: 'equalsAny', values: ['YES', 'UNSURE']}, {stateKey: 'marketplaceChangeIndicated', operator: 'equals', value: true}], notes: 'Do not show merely because Form 1095-A exists; show only when a household, income, address, or coverage change is indicated.'},
        notesCategory: 'Marketplace — Coverage changes'
      },
      {
        questionId: 'other_tax_situation',
        questionVersion: VERSION,
        category: 'OTHER_FACTS',
        topic: 'Other unusual tax situation',
        questionText: 'Please describe anything else about your tax situation that you think your preparer should know.',
        helperText: 'If you are unsure whether something matters, you can include it here.',
        requiredWhenShown: false,
        subjectType: 'RETURN',
        trigger: {mode: 'ANY', conditions: [{stateKey: 'organizerFlags', operator: 'hasRelevantUnusualSituation'}, {stateKey: 'additionalTaxContextRequested', operator: 'equals', value: true}], notes: 'Show for a relevant unusual organizer flag or when the taxpayer elects to provide more information.'},
        notesCategory: 'Other — Additional facts'
      }
    ]
  };

  window.PCT_INTAKE_INTERVIEW_V2 = freeze(definition);
})(window);
