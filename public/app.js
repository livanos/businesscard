document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const cameraInput = document.getElementById('camera-input');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const placeholder = document.getElementById('placeholder');
    const scanButton = document.getElementById('scan-button');
    const loading = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const contactInfo = document.getElementById('contact-info');
    const downloadVcardBtn = document.getElementById('download-vcard');
    const newScanBtn = document.getElementById('new-scan');
    
    let selectedFile = null;
    let contactData = null;
    let vcardData = null;

    // Event listeners for file inputs
    cameraInput.addEventListener('change', handleFileSelect);
    fileInput.addEventListener('change', handleFileSelect);

    // Scan button
    scanButton.addEventListener('click', processImage);

    // Download vCard
    downloadVcardBtn.addEventListener('click', downloadVcard);

    // New scan button
    newScanBtn.addEventListener('click', resetForm);

    // Handle file selection from camera or file upload
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        selectedFile = file;
        displayImagePreview(file);
        scanButton.disabled = false;
    }

    // Display image preview
    function displayImagePreview(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        
        reader.readAsDataURL(file);
    }

    // Process image with OpenAI
    async function processImage() {
        if (!selectedFile) return;

        try {
            // Show loading state
            loading.style.display = 'flex';
            scanButton.disabled = true;
            resultContainer.style.display = 'none';

            // Create form data
            const formData = new FormData();
            formData.append('image', selectedFile);

            // Send to server
            const response = await fetch('/api/process-card', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process business card');
            }

            const data = await response.json();
            contactData = data.contact;
            vcardData = data.vcard;

            // Display results
            displayResults(contactData);
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Error:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    // Display contact information
    function displayResults(contact) {
        contactInfo.innerHTML = '';
        
        // Define fields to display with their labels
        const fields = [
            { key: 'name', label: 'Name' },
            { key: 'title', label: 'Title' },
            { key: 'company', label: 'Company' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'mobile', label: 'Mobile' },
            { key: 'website', label: 'Website' },
            { key: 'address', label: 'Address' },
            { key: 'linkedin', label: 'LinkedIn' },
            { key: 'twitter', label: 'Twitter' },
            { key: 'other', label: 'Other' }
        ];

        // Create HTML for each field that exists in the contact data
        fields.forEach(field => {
            if (contact[field.key]) {
                const fieldElement = document.createElement('div');
                fieldElement.className = 'contact-field';
                
                // Special handling for email and website to make them clickable
                let fieldValue = contact[field.key];
                if (field.key === 'email') {
                    fieldValue = `<a href="mailto:${fieldValue}">${fieldValue}</a>`;
                } else if (field.key === 'website') {
                    // Ensure the URL has http/https
                    let url = fieldValue;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    fieldValue = `<a href="${url}" target="_blank">${fieldValue}</a>`;
                } else if (field.key === 'linkedin') {
                    let url = fieldValue;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    fieldValue = `<a href="${url}" target="_blank">${fieldValue}</a>`;
                } else if (field.key === 'twitter') {
                    let url = fieldValue;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://twitter.com/' + fieldValue.replace('@', '');
                    }
                    fieldValue = `<a href="${url}" target="_blank">${fieldValue}</a>`;
                }
                
                fieldElement.innerHTML = `
                    <div class="field-name">${field.label}:</div>
                    <div class="field-value">${fieldValue}</div>
                `;
                
                contactInfo.appendChild(fieldElement);
            }
        });

        resultContainer.style.display = 'block';
    }

    // Download vCard file
    function downloadVcard() {
        if (!vcardData) return;
        
        const filename = contactData.name ? `${contactData.name.replace(/\s+/g, '_')}.vcf` : 'contact.vcf';
        const blob = new Blob([vcardData], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Reset form for a new scan
    function resetForm() {
        // Reset file inputs
        cameraInput.value = '';
        fileInput.value = '';
        
        // Reset preview
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        placeholder.style.display = 'flex';
        
        // Reset button state
        scanButton.disabled = true;
        
        // Hide results
        resultContainer.style.display = 'none';
        
        // Reset data
        selectedFile = null;
        contactData = null;
        vcardData = null;
    }
});
