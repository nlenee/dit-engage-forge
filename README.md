# DIT Engagement Pro

Using the pdf attached as a sample template, and using the image attached as the logo build this app. DIT Letter of Engagement Generator (AI-Powered)

Build a secure, professional web application for DIT that generates official Letters of Engagement, styled exactly like the provided DIT sample letter, and allows downloading as PDF and sending via email when authorized.

1. Core Purpose

The system should help DIT administrators easily create, manage, and distribute Letters of Engagement that are:

Visually consistent with DIT branding

Legally professional

Digitally signed

Downloadable as PDF

Optionally emailed to recipients

2. User Roles & Access

Admin / Authorized User

Can create, edit, preview, download, and email letters

Can upload signatures

Can manage remembered offices/titles

System Security

Email sending must require explicit authorization/confirmation before dispatch

3. Letter Creation Form (Smart AI-Assisted)
A. Recipient Information

Full Name (required)

Email Address (required)

Country (dropdown of all countries)

State/Province (dynamic dropdown based on selected country)

B. Engagement Details

Office / Position Engaged

Dropdown of previously used offices

Option to add a new office

System remembers and suggests frequently used titles

Date of Assignment

Auto-defaults to current date

Same date used for signature

Location

Auto-formatted as: State, Country

C. Letter Content

Rich text editor for the body of the letter

AI assistance to:

Improve clarity and professionalism

Maintain formal engagement tone

Must preserve user-entered wording unless edited intentionally

4. Signatories & Digital Signatures

Ability to add one or multiple signatories

For each signatory:

Full Name

Title/Office

Signature Upload (JPG or PNG)

System must:

Render the uploaded signature exactly as provided

Place each signature correctly in the letter

Label each signature with the signer’s name and title

Signature date = Date of Assignment

5. Branding & Design (STRICT REQUIREMENT)

Use the DIT logo exactly as provided (no resizing distortion, recoloring, or modification)

Replicate the letterhead style, layout, spacing, and typography from the sample letter

Use the exact DIT color scheme

Generate a beautiful, elegant, professional engagement letter card

Layout must look official and printable (not like a generic document)

6. Letter Preview & Output

Live preview of the final letter before export

Export options:

Download as high-quality PDF

Filename format:
DIT_Letter_of_Engagement_[Recipient_Name]_[Date].pdf

7. Email Sending (Optional, Authorized)

Email feature with:

Recipient email auto-filled

Editable subject and message body

PDF attached automatically

Must include:

Confirmation step before sending

Success / failure notification

Store a log of sent letters (date, recipient, sender)

8. Data Memory & Intelligence

Remember:

Previously used offices/titles

Frequent signatories

Smart suggestions when creating new letters

Ability to reuse past letters as templates

9. Dashboard & Records

Dashboard showing:

Total letters created

Letters sent vs downloaded

Recent engagements

Search and filter letters by:

Name

Office

Date

Country

10. Technical Expectations

Responsive (desktop & mobile friendly)

Secure file handling for signatures

Clean, modern UI aligned with DIT’s professional image

Scalable for future document types (appointments, renewals, certificates)

11. Overall Goal

Deliver a polished AI-powered Letter of Engagement system that feels official, trustworthy, and worthy of DIT’s leadership standards—reducing manual work while preserving formality, beauty, and authority.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dit-engage-forge.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a654387c-339b-44b7-8406-efc8f2fada32).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
