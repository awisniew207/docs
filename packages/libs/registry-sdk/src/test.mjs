import { z } from 'zod';

// Define the schema for an array of valid URLs
const urlArraySchema = z.array(z.string().url());

console.log('=== Zod URL Array Validation Demo ===\n');

// Test 1: Valid URLs
console.log('1. Testing with valid URLs:');
const validUrls = ['https://example.com', 'http://google.com', 'https://github.com/user/repo'];

console.log('Input:', validUrls);
const validResult = urlArraySchema.safeParse(validUrls);
console.log('Success:', validResult.success);
if (validResult.success) {
  console.log('Parsed data:', validResult.data);
}
console.log('\n---\n');

// Test 2: Mixed valid and invalid URLs
console.log('2. Testing with mixed valid/invalid URLs:');
const mixedUrls = [
  'https://example.com', // valid
  'not-a-url', // invalid
  'http://valid.com', // valid
  'invalid-url-2', // invalid
  'ftp://files.com', // valid
];

console.log('Input:', mixedUrls);
const mixedResult = urlArraySchema.safeParse(mixedUrls);
console.log('Success:', mixedResult.success);

if (!mixedResult.success) {
  const error = mixedResult.error;

  console.log('\n--- ERROR SHAPE DEMONSTRATION ---');

  // Show the raw error structure
  console.log('\nRaw error issues:');
  error.issues.forEach((issue, index) => {
    console.log(`Issue ${index + 1}:`, {
      code: issue.code,
      validation: issue.validation,
      path: issue.path,
      message: issue.message,
      received: issue.received,
    });
  });

  // Show formatted errors
  console.log('\nFormatted errors:');
  const formatted = error.format();
  console.log(JSON.stringify(formatted, null, 2));

  // Show flattened errors
  console.log('\nFlattened errors:');
  const flattened = error.flatten();
  console.log('Form errors:', flattened.formErrors);
  console.log('Field errors:', flattened.fieldErrors);

  // Show the main error message
  console.log('\nMain error message:');
  console.log(error.message);

  // Demonstrate accessing specific errors by index
  console.log('\nAccessing errors by array index:');
  error.issues.forEach((issue) => {
    const arrayIndex = issue.path[0];
    console.log(`Array index ${arrayIndex}: "${mixedUrls[arrayIndex]}" - ${issue.message}`);
  });
}

console.log('\n---\n');

// Test 3: All invalid URLs
console.log('3. Testing with all invalid URLs:');
const allInvalidUrls = ['not-a-url', 'also-invalid', 'still-not-valid'];

console.log('Input:', allInvalidUrls);
const allInvalidResult = urlArraySchema.safeParse(allInvalidUrls);
console.log('Success:', allInvalidResult.success);

if (!allInvalidResult.success) {
  console.log(`\nNumber of validation errors: ${allInvalidResult.error.issues.length}`);
  console.log('All errors:');
  allInvalidResult.error.issues.forEach((issue, index) => {
    console.log(`  ${index + 1}. Index ${issue.path[0]}: ${issue.message}`);
  });
}

console.log('\n---\n');

// Test 4: Empty array
console.log('4. Testing with empty array:');
const emptyArray = [];
console.log('Input:', emptyArray);
const emptyResult = urlArraySchema.safeParse(emptyArray);
console.log('Success:', emptyResult.success);
console.log('Data:', emptyResult.success ? emptyResult.data : 'N/A');

console.log('\n---\n');

// Test 5: Non-array input
console.log('5. Testing with non-array input:');
const nonArray = 'https://example.com';
console.log('Input:', nonArray);
const nonArrayResult = urlArraySchema.safeParse(nonArray);
console.log('Success:', nonArrayResult.success);

if (!nonArrayResult.success) {
  console.log('Error type:', nonArrayResult.error.issues[0].code);
  console.log('Error message:', nonArrayResult.error.issues[0].message);
}

console.log('\n=== Demo Complete ===');
