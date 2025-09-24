# Test Cases for JBIT Contact Form

## Form Overview
- **URL**: https://jbit.be/contact-nl/
- **Type**: Contact Form
- **Language**: Dutch (nl)
- **Fields**: 5 (Name, Email, Phone, Interests, Message)

## Test Scenarios

### 1. Happy Path Tests

#### TC-001: Successful Form Submission
**Objective**: Verify form submits successfully with valid data
**Steps**:
1. Navigate to https://jbit.be/contact-nl/
2. Fill in all required fields with valid data:
   - Naam: "Jan van der Berg"
   - Email: "jan.vandenberg@example.com"
   - Telefoon: "+31 6 12345678"
   - Interesse: Select "Webdesign"
   - Bericht: "Ik ben geïnteresseerd in uw diensten."
3. Click "Send" button
4. Wait for response

**Expected Result**:
- Form submission succeeds
- Success message appears
- Form fields are cleared or form is hidden
- No error messages displayed

### 2. Required Field Validation Tests

#### TC-002: Empty Required Fields Validation
**Objective**: Verify required field validation works
**Steps**:
1. Navigate to form page
2. Leave all fields empty
3. Click "Send" button

**Expected Result**:
- Form does not submit
- Error messages appear for required fields:
  - "Naam is verplicht" (Name is required)
  - "Email is verplicht" (Email is required)
  - "Bericht is verplicht" (Message is required)

#### TC-003: Individual Required Field Validation
**Objective**: Test each required field individually
**Steps**:
1. Fill all required fields except one
2. Submit form
3. Repeat for each required field

**Expected Result**:
- Form validation fails for missing field
- Specific error message for the empty required field
- Other fields retain their values

### 3. Email Validation Tests

#### TC-004: Invalid Email Format
**Objective**: Verify email format validation
**Test Data**:
- "invalid-email" (no @ symbol)
- "test@" (incomplete domain)
- "@domain.com" (missing local part)
- "test@domain" (missing TLD)

**Steps**:
1. Fill form with valid data except email field
2. Enter invalid email format
3. Submit form

**Expected Result**:
- Email validation error appears
- Form does not submit
- Error message: "Voer een geldig emailadres in"

#### TC-005: Valid Email Formats
**Objective**: Verify various valid email formats are accepted
**Test Data**:
- "test@example.com"
- "user.name@domain.co.uk"
- "user+tag@example.org"

**Steps**:
1. Fill form with valid data
2. Use different valid email formats
3. Submit form

**Expected Result**:
- No email validation errors
- Form submits successfully

### 4. Optional Field Tests

#### TC-006: Form Submission Without Optional Fields
**Objective**: Verify form works without optional fields
**Steps**:
1. Fill only required fields (Naam, Email, Bericht)
2. Leave Telefoon and Interesse empty
3. Submit form

**Expected Result**:
- Form submits successfully
- No validation errors for optional fields

### 5. Interest Selection Tests

#### TC-007: Multiple Interest Selection
**Objective**: Test selecting multiple interests
**Steps**:
1. Fill required fields with valid data
2. Select multiple options in Interesse field
3. Submit form

**Expected Result**:
- Multiple selections are accepted
- Form submits successfully

### 6. Message Field Tests

#### TC-008: Long Message Text
**Objective**: Test textarea with extended content
**Steps**:
1. Fill required fields
2. Enter a very long message (500+ characters)
3. Submit form

**Expected Result**:
- Long text is accepted
- Form submits successfully
- No character limit errors

### 7. Special Characters Tests

#### TC-009: Special Characters in Text Fields
**Objective**: Verify handling of special characters
**Test Data**:
- Name with accents: "José van der Müller"
- Message with symbols: "Vraag over prijs & service (10% korting?)"

**Steps**:
1. Fill form with special characters
2. Submit form

**Expected Result**:
- Special characters are accepted
- Form submits without encoding issues

### 8. Form Interaction Tests

#### TC-010: Form Reset/Clear
**Objective**: Test form behavior after successful submission
**Steps**:
1. Submit form successfully
2. Check if form is cleared or reset

**Expected Result**:
- Form fields are cleared after successful submission
- OR success message replaces form

#### TC-011: Error Recovery
**Objective**: Test correcting validation errors
**Steps**:
1. Submit form with validation errors
2. Correct the errors
3. Resubmit form

**Expected Result**:
- Previous error messages disappear
- Form submits successfully after corrections

## Priority Levels
- **High Priority**: TC-001, TC-002, TC-004 (core functionality)
- **Medium Priority**: TC-003, TC-005, TC-006, TC-011 (important validation)
- **Low Priority**: TC-007, TC-008, TC-009, TC-010 (edge cases)

## Test Environment Requirements
- Modern browser (Chrome, Firefox, Safari)
- JavaScript enabled
- Network connectivity for form submission
- Dutch language support for proper message display