// Cloudflare Worker code for file upload/download with auto-delete functionality

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle upload
    if (method === 'POST' && url.pathname === '/upload') {
        return handleUpload(request);
    }
    // Handle download
    else if (method === 'GET' && url.pathname.startsWith('/download/')) {
        return handleDownload(url.pathname.split('/').pop());
    }
    return new Response('Not found', { status: 404 });
}

async function handleUpload(request) {
    const file = await request.text(); // For simplicity, we assume the file is sent as text
    const fileId = Date.now(); // Simple timestamp-based unique ID
    await uploadToStorage(fileId, file);
    return new Response(`File uploaded with ID: ${fileId}`, { status: 200 });
}

async function handleDownload(id) {
    const file = await downloadFromStorage(id);
    if (file) {
        return new Response(file, { status: 200 });
    }
    return new Response('File not found', { status: 404 });
}

async function uploadToStorage(id, file) {
    // Simulate storage with in-memory (replace with actual storage code)
    globalThis.storage = globalThis.storage || {};
    globalThis.storage[id] = file;
    // Schedule auto-delete after 24 hours
    setTimeout(() => delete globalThis.storage[id], 24 * 60 * 60 * 1000);
}

async function downloadFromStorage(id) {
    return globalThis.storage ? globalThis.storage[id] : null;
}