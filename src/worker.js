export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;

        // Handle upload
        if (method === 'POST' && url.pathname === '/upload') {
            return await handleUpload(request, env);
        }
        // Handle download
        else if (method === 'GET' && url.pathname.startsWith('/download/')) {
            const id = url.pathname.split('/').pop();
            return await handleDownload(id, env);
        }
        // Handle root path (Welcome page & UI)
        else if (method === 'GET' && url.pathname === '/') {
            return handleRoot(url);
        }
        
        return new Response('Not found', { status: 404 });
    }
};

function handleRoot(url) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>f-drop</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 2rem; max-width: 600px; margin: auto; line-height: 1.6; color: #333; }
        .upload-box, .download-box { border: 2px dashed #ccc; padding: 2rem; text-align: center; margin-bottom: 1.5rem; border-radius: 8px; transition: all 0.2s ease; background-color: #fafafa; }
        .download-box { border: 2px solid #ddd; }
        .upload-box.dragover { border-color: #007bff; background-color: #f0f8ff; }
        #result { margin-top: 1rem; padding: 1rem; border-radius: 6px; display: none; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        button { padding: 0.6rem 1.2rem; background-color: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 500; transition: background-color 0.2s; margin-top: 1rem; }
        button:hover { background-color: #0056b3; }
        button:disabled { background-color: #8bbaf0; cursor: not-allowed; }
        input[type="file"] { display: none; }
        .file-label { display: inline-block; padding: 0.6rem 1.2rem; background-color: #6c757d; color: white; border-radius: 6px; cursor: pointer; margin-right: 0.5rem; font-size: 1rem; font-weight: 500; transition: background-color 0.2s; }
        .file-label:hover { background-color: #5a6268; }
        .download-link { display: inline-block; margin-top: 10px; padding: 10px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .download-link:hover { background: #218838; }
        .form-group { text-align: left; max-width: 300px; margin: 1.5rem auto 0; }
        .form-group label { display: block; font-size: 0.9rem; margin-bottom: 0.5rem; color: #555; }
        .form-group input[type="email"], .form-group input[type="text"] { width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 1rem; }
        .copyable-url { width: 100%; padding: 0.5rem; margin-top: 0.5rem; border: 1px solid #b8daff; background-color: #cce5ff; border-radius: 4px; font-family: monospace; font-size: 0.9rem; box-sizing: border-box; }
    </style>
</head>
<body>
    <h1>Welcome to f-drop! 📦</h1>
    <p>A temporary file drop powered by Cloudflare R2.</p>
    
    <div class="upload-box" id="dropzone">
        <h3>Upload a File</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">Drag & drop a file here or</p>
        <form id="uploadForm">
            <div>
                <label class="file-label" for="fileInput">Choose File</label>
                <input type="file" id="fileInput" name="file" required>
            </div>
            <p id="fileName" style="margin-top: 1rem; font-size: 0.9em; font-weight: bold; color: #0056b3;"></p>
            
            <div class="form-group">
                <label for="passwordInput">Upload Password (Required):</label>
                <input type="password" id="passwordInput" name="password" required placeholder="Secret password" style="width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 1rem;">
            </div>

            <div class="form-group">
                <label for="emailInput">Email Download Link (Optional):</label>
                <input type="email" id="emailInput" name="email" placeholder="you@example.com">
            </div>
            
            <button type="submit">Upload File</button>
        </form>
    </div>

    <div id="result"></div>

    <div class="download-box">
        <h3>Download a File</h3>
        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">Have a file ID? Enter it below to download.</p>
        <form id="downloadForm">
            <div class="form-group" style="margin-top: 0;">
                <input type="text" id="fileIdInput" placeholder="e.g. m0xk2... " required>
            </div>
            <button type="submit" style="background-color: #28a745;">Download</button>
        </form>
    </div>

    <script>
        const form = document.getElementById('uploadForm');
        const fileInput = document.getElementById('fileInput');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const dropzone = document.getElementById('dropzone');
        const fileNameDisplay = document.getElementById('fileName');
        const resultDiv = document.getElementById('result');
        const downloadForm = document.getElementById('downloadForm');
        const fileIdInput = document.getElementById('fileIdInput');

        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                fileNameDisplay.textContent = 'Selected: ' + e.target.files[0].name;
            } else {
                fileNameDisplay.textContent = '';
            }
        });

        // Drag and drop support
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                fileNameDisplay.textContent = 'Selected: ' + e.dataTransfer.files[0].name;
            }
        });

        // Handle Download Form
        downloadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = fileIdInput.value.trim();
            if (id) {
                window.open(window.location.origin + '/download/' + id, '_blank');
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (fileInput.files.length === 0) return;
            
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file);
            if (emailInput.value) {
                formData.append('email', emailInput.value);
            }
            if (passwordInput.value) {
                formData.append('password', passwordInput.value);
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            resultDiv.style.display = 'none';
            resultDiv.className = '';

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                resultDiv.style.display = 'block';
                
                if (response.ok) {
                    const downloadUrl = window.location.origin + '/download/' + data.id;
                    resultDiv.className = 'success';
                    resultDiv.innerHTML = \`
                        <strong>🎉 Upload Successful!</strong><br>
                        <p style="margin: 0.5rem 0;">File: \${data.name} (ID: <strong>\${data.id}</strong>)</p>
                        
                        <div style="margin: 1rem 0; text-align: left;">
                            <label style="font-size: 0.9rem; color: #555;">Shareable Link:</label>
                            <input type="text" class="copyable-url" value="\${downloadUrl}" readonly onclick="this.select()">
                        </div>

                        \${data.emailSent ? '<p style="color: #155724; font-size: 0.9em; margin: 0.5rem 0;">Email sent to ' + emailInput.value + '</p>' : ''}
                        \${data.emailError ? '<p style="color: #721c24; font-size: 0.9em; margin: 0.5rem 0;"><strong>Could not send email:</strong> ' + data.emailError + '</p>' : ''}
                        
                        <a href="\${downloadUrl}" class="download-link" target="_blank">Download File</a>
                    \`;
                    fileInput.value = '';
                    emailInput.value = '';
                    fileNameDisplay.textContent = '';
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            } catch (error) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'error';
                resultDiv.innerHTML = '<strong>❌ Error:</strong> ' + error.message;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Upload File';
            }
        });
    </script>
</body>
</html>`;
    return new Response(html, { 
        status: 200, 
        headers: { 'Content-Type': 'text/html' } 
    });
}

async function handleUpload(request, env) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const email = formData.get('email');
        const password = formData.get('password');

        if (password !== env.UPLOAD_PASSWORD) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Incorrect upload password' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!file || !(file instanceof File)) {
            return new Response(JSON.stringify({ error: 'No file uploaded or invalid format' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const fileId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
        
        await env.f_drop_bucket.put(fileId, file.stream(), {
            httpMetadata: {
                contentType: file.type || 'application/octet-stream'
            },
            customMetadata: {
                originalName: file.name
            }
        });

        const url = new URL(request.url);
        const downloadUrl = `${url.origin}/download/${fileId}`;
        
        let emailSent = false;
        let emailError = null;

        if (email) {
            if (!env.RESEND_API_KEY) {
                emailError = "RESEND_API_KEY is not configured on the server.";
            } else {
                try {
                    const emailReq = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${env.RESEND_API_KEY}`
                        },
                        body: JSON.stringify({
                            from: 'f-drop <noreply@moltbot.de5.net>',
                            to: email,
                            subject: 'Your f-drop file is ready to download',
                            html: `<h2>Your file has been uploaded</h2>
                                   <p>File name: <strong>${file.name}</strong></p>
                                   <p>Click the link below to download your file:</p>
                                   <a href="${downloadUrl}">${downloadUrl}</a>`
                        })
                    });

                    if (!emailReq.ok) {
                        const errText = await emailReq.text();
                        console.error('Email send failed:', errText);
                        emailError = `Resend API Error: ${errText}. (Ensure your domain is verified in Resend)`;
                    } else {
                        emailSent = true;
                    }
                } catch (err) {
                    emailError = err.message;
                }
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            id: fileId, 
            name: file.name,
            emailSent,
            emailError
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleDownload(id, env) {
    if (!id) {
        return new Response('Missing file ID', { status: 400 });
    }

    try {
        const object = await env.f_drop_bucket.get(id);

        if (object === null) {
            return new Response('File not found or expired', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        
        const originalName = object.customMetadata && object.customMetadata.originalName;
        if (originalName) {
            headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
        }

        return new Response(object.body, {
            status: 200,
            headers: headers
        });
    } catch (error) {
        return new Response('Error retrieving file', { status: 500 });
    }
}