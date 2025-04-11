const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function processBusinessCard(base64Image) {
    try {

        // Call OpenAI API to analyze the business card image with structured outputs
        const businessCardSchema = {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Full name of the person on the business card"
                },
                title: {
                    type: "string",
                    description: "Job title of the person"
                },
                company: {
                    type: "string",
                    description: "Company name"
                },
                email: {
                    type: "string",
                    description: "Email address"
                },
                phone: {
                    type: "string",
                    description: "Primary phone number"
                },
                mobile: {
                    type: "string",
                    description: "Mobile/cell phone number if specifically labeled as such"
                },
                website: {
                    type: "string",
                    description: "Website URL"
                },
                address: {
                    type: "string",
                    description: "Physical address"
                },
                linkedin: {
                    type: "string",
                    description: "LinkedIn profile URL or username"
                },
                twitter: {
                    type: "string",
                    description: "Twitter/X handle or URL"
                },
                other: {
                    type: "string",
                    description: "Any other social media or relevant information"
                }
            },
            required: ["name", "title", "company", "email", "phone", "mobile", "website", "address", "linkedin", "twitter", "other"],
            additionalProperties: false
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a business card analyzer. Extract all contact information from the business card image, including:
                    - name: Full name of the person
                    - title: Job title
                    - company: Company name
                    - email: Email address
                    - phone: Phone number
                    - mobile: Mobile phone if labeled as such
                    - website: Website URL
                    - address: Physical address
                    - linkedin: LinkedIn profile
                    - twitter: Twitter/X handle
                    - other: Any other social media or contact information
                    
                    For any fields not present in the image, return an empty string.`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract all contact information from this business card." },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high"
                            },
                        },
                    ],
                },
            ],
            response_format: { 
                type: "json_schema", 
                json_schema: {
                    name: "business_card_data",
                    schema: businessCardSchema,
                    strict: true
                }
            },
            max_tokens: 1000
        });

        // Check if there's a refusal
        if (response.choices[0].message.refusal) {
            throw new Error(`Model refused to process the image: ${response.choices[0].message.refusal}`);
        }

        // Check if there's a content filter
        if (response.choices[0].finish_reason === "content_filter") {
            throw new Error("The image contains content that violates usage policies");
        }

        // Check if the response was cut off
        if (response.choices[0].finish_reason === "length") {
            throw new Error("The response was truncated due to token limits. Try again with a clearer image.");
        }

        // Extract the contact information from the response
        const contactData = JSON.parse(response.choices[0].message.content);
        
        // Filter out empty strings for cleaner output
        const filteredContactData = Object.fromEntries(
            Object.entries(contactData).filter(([_, value]) => value !== "")
        );
        
        // Check if we have any meaningful data
        if (Object.keys(filteredContactData).length === 0) {
            throw new Error("Could not extract any information from the image. Please try again with a clearer image.");
        }
        
        // Generate vCard
        const vcard = generateVCard(filteredContactData);
        
        return {
            contact: filteredContactData,
            vcard: vcard
        };
    } catch (error) {
        console.error('Error in OpenAI processing:', error);
        
        // Provide more user-friendly error messages
        if (error.message.includes('API key')) {
            throw new Error('Authentication error: Invalid API key or missing permissions');
        } else if (error.message.includes('rate limit')) {
            throw new Error('Rate limit exceeded: Please try again later');
        } else if (error.message.includes('not a business card')) {
            throw new Error('The uploaded image does not appear to be a business card');
        } else if (error.response && error.response.status === 413) {
            throw new Error('The image file is too large. Please use a smaller image');
        } else if (error.message.includes('Invalid schema')) {
            throw new Error('There was an issue with the data format. Please contact support.');
        } else {
            throw error;
        }
    }
}

function generateVCard(contact) {
    // Format the data as a vCard (RFC 6350)
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    if (contact.name) {
        vcard += `FN:${contact.name}\n`;
        // Attempt to split name into parts (simple approach)
        const nameParts = contact.name.split(' ');
        if (nameParts.length > 1) {
            const lastName = nameParts.pop();
            const firstName = nameParts.join(' ');
            vcard += `N:${lastName};${firstName};;;\n`;
        } else {
            vcard += `N:${contact.name};;;;\n`;
        }
    }
    
    // Handle multi-line values with proper folding
    if (contact.title) {
        // Replace newlines with a space for proper vCard format
        const title = contact.title.replace(/\r?\n/g, ' ');
        vcard += `TITLE:${title}\n`;
    }
    
    if (contact.company) vcard += `ORG:${contact.company}\n`;
    if (contact.email) vcard += `EMAIL;type=INTERNET;type=WORK:${contact.email}\n`;
    if (contact.phone) vcard += `TEL;type=WORK:${contact.phone}\n`;
    if (contact.mobile) vcard += `TEL;type=CELL:${contact.mobile}\n`;
    if (contact.website) vcard += `URL:${contact.website}\n`;
    
    if (contact.address) {
        // Replace newlines with a space for proper vCard format
        const address = contact.address.replace(/\r?\n/g, ', ');
        vcard += `ADR;type=WORK:;;${address};;;\n`;
    }
    
    if (contact.linkedin) vcard += `X-SOCIALPROFILE;type=linkedin:${contact.linkedin}\n`;
    if (contact.twitter) vcard += `X-SOCIALPROFILE;type=twitter:${contact.twitter}\n`;
    
    vcard += 'END:VCARD';
    return vcard;
}

module.exports = { processBusinessCard };
