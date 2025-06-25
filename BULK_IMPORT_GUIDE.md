# Bulk Import Guide for TabNavi Password Manager

## Overview
The bulk import feature allows you to quickly import multiple passwords from a text file. This is useful when migrating from another password manager or when you need to add many passwords at once.

## File Format Requirements

### Basic Format
Each line in your text file should follow this format:
```
website : password
```

### Rules
1. **Separator**: Use a colon (`:`) to separate the website/app name from the password
2. **Spaces**: Spaces around the colon are optional but recommended for readability
3. **Comments**: Lines starting with `#` are treated as comments and ignored
4. **Empty Lines**: Empty lines are ignored
5. **Case Sensitivity**: Website names are case-sensitive

### Valid Examples
```
facebook : myPassword123
Google : anotherPassword456
Bank-of-America : securePassword789
my-work-portal : workPassword101
# This is a comment - it will be ignored
netflix : streamingPassword202
```

### Invalid Examples
```
facebook myPassword123        # Missing colon
: passwordWithoutWebsite      # Missing website name
facebook :                    # Missing password
facebook : : extraColon       # Multiple colons (only first one counts)
```

## Step-by-Step Instructions

### 1. Prepare Your Text File
- Create a new text file (`.txt` extension)
- Add your passwords following the format above
- Save the file to your device

### 2. Access Bulk Import
- Open TabNavi Password Manager
- Go to the "Passwords" tab
- Look for the green upload button (📁) next to the add (+) button
- Tap the upload button

### 3. Select Your File
- The file picker will open
- Navigate to your text file
- Select the file

### 4. Review Preview
- TabNavi will parse your file and show a preview
- Check that all passwords were parsed correctly
- If there are errors, they will be displayed
- You can choose to continue with valid entries or go back to fix the file

### 5. Import Passwords
- If you're satisfied with the preview, tap "Import All Passwords"
- All passwords will be encrypted and stored securely
- You'll see a confirmation with the number of successfully imported passwords

## Security Notes

### Encryption
- All passwords are encrypted using AES-256 encryption before storage
- Your master password is used as the encryption key
- Even if someone gains access to your device, your passwords remain secure

### File Handling
- The text file is only read temporarily during import
- No copy of your passwords is kept in plain text
- Consider deleting the text file after successful import

### Best Practices
- Never share your password text files
- Use secure file transfer methods if moving files between devices
- Verify that all passwords were imported correctly before deleting the source file

## Troubleshooting

### Common Issues

**File Not Opening**
- Ensure the file has a `.txt` extension
- Make sure the file isn't corrupted or too large

**Parsing Errors**
- Check that each line follows the `website : password` format
- Look for missing colons or empty fields
- Remove any special characters that might cause issues

**Some Passwords Not Imported**
- Check the error messages in the preview
- Verify that problematic lines follow the correct format
- Empty passwords or website names will be skipped

**Import Fails**
- Ensure you have sufficient storage space
- Check your internet connection if syncing to cloud
- Try importing a smaller batch of passwords

### Error Messages

- **"Invalid format (missing colon)"**: Add a colon between website and password
- **"Empty website or password"**: Ensure both fields have content
- **"Failed to import"**: Check storage space and try again

## Example Files

### Sample 1: Basic Passwords
```
facebook : myFacebookPass123
gmail : myGmailPassword456
github : myGitHubToken789
```

### Sample 2: Organized with Comments
```
# Social Media Accounts
facebook : socialPass123
twitter : twitterKey456
instagram : instaSecret789

# Work Related
slack : workSlackPass101
zoom : workZoomKey202
company-portal : companyPass303

# Banking (Example only - never use real banking passwords!)
testbank : testBankPass404
```

### Sample 3: Various Website Formats
```
my-bank.com : bankingPassword123
work_portal : workPassword456
app-name : appPassword789
Service Name : servicePassword101
```

## Migration from Other Password Managers

### From LastPass
1. Export your LastPass vault as CSV
2. Convert CSV to the required text format
3. Use the bulk import feature

### From 1Password
1. Export as unencrypted text
2. Reformat to match TabNavi requirements
3. Import using bulk import

### From Browser Saved Passwords
1. Export browser passwords (Chrome/Firefox/Safari)
2. Convert to text format
3. Import to TabNavi

## Support

If you encounter issues with bulk import:
1. Check this guide for solutions
2. Verify your file format matches the requirements
3. Try with a smaller test file first
4. Contact support if problems persist

Remember: Always keep your passwords secure and never share them in plain text files!
