const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function processBusinessCard(base64Image) {
    try {
        // Call OpenAI API to analyze the business card image
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a business card analyzer. Extract all contact information from the business card image. 
                    Return the data as JSON with these fields (only include fields that are available in the image):
                    - name: Full name of the person
                    - title: Job title
                    - company: Company name
                    - email: Email address
                    - phone: Phone number(s) - if multiple are present, include all
                    - mobile: Mobile number if specifically labeled as mobile/cell
                    - website: Website URL
                    - address: Physical address
                    - linkedin: LinkedIn profile if present
                    - twitter: Twitter/X handle if present
                    - other: Any other social media or relevant information`
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
            response_format: { type: "json_object" }
        });

        // Extract the contact information from the response
        const contactData = JSON.parse(response.choices[0].message.content);
        
        // Generate vCard
        const vcard = generateVCard(contactData);
        
        return {
            contact: contactData,
            vcard: vcard
        };
    } catch (error) {
        console.error('Error in OpenAI processing:', error);
        throw error;
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
