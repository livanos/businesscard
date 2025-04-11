# Business Card Scanner App

A web application that allows users to take photos of business cards and convert them into digital contacts using OpenAI's GPT-4o vision capabilities with Structured Outputs.

## Features

- Capture photos of business cards on mobile or desktop devices
- Upload existing images of business cards
- Extract contact information using GPT-4o with reliable schema validation via Structured Outputs
- Generate downloadable vCard files for phone contacts
- Mobile-responsive design works on both iOS and Android devices
- Enhanced error handling and user feedback

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **Image Processing**: OpenAI GPT-4o with vision capabilities and Structured Outputs
- **File Handling**: Multer for image uploads

## Setup and Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Visit `http://localhost:3000` in your browser

## How to Use

1. Open the application on your mobile device or computer
2. Take a photo of a business card using the "Take Photo" button, or upload an existing image
3. Click "Scan Card" to process the image
4. Review the extracted contact information
5. Download the vCard file to add the contact to your phone

## Project Structure

```
businesscard/
├── public/              # Static files
│   ├── index.html       # Main HTML file
│   ├── styles.css       # CSS styles
│   └── app.js           # Frontend JavaScript
├── src/                 # Server-side code
│   ├── server.js        # Express server setup
│   └── openai.js        # OpenAI integration and vCard generation
├── .env                 # Environment variables (create this)
├── .env.example         # Example environment variables
├── package.json         # Project metadata and dependencies
└── README.md            # Project documentation
```

## Implementation Details

### OpenAI Structured Outputs

This application uses OpenAI's Structured Outputs feature to ensure consistent, reliable data extraction from business cards. Structured Outputs enforces a JSON schema that guarantees the model will always return data in the expected format, making the application more robust.

Key benefits:
- Reliable type safety: The response always follows our defined schema
- Consistent field formatting: All contact fields are properly structured
- Better error handling: Clear identification of refusals and processing issues

The schema includes fields for name, title, company, contact information, and social media profiles - all essential data found on typical business cards.

## Notes

- This application uses OpenAI's GPT-4o model, which will incur API usage costs based on the number and size of images processed.
- Processing time may vary depending on OpenAI API response times.
- For best results, ensure business cards are well-lit and clearly visible in photos.
- If a card is missing certain information, those fields will be omitted from the result and vCard.

## License

MIT