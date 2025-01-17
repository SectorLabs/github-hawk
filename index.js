const crypto = require('crypto');

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * Copied from https://github.com/octokit/webhooks.js
 *
 * For reasons, see:
 * https://github.com/octokit/webhooks.js/issues/71
 * https://github.com/octokit/webhooks.js/pull/96
 */
function toNormalizedJsonString(payload) {
    return JSON.stringify(payload).replace(/[^\\]\\u[\da-f]{4}/g, s => {
        return s.substr(0, 3) + s.substr(3).toUpperCase();
    });
}

/**
 * Validate GitHub request
 */
function createHexSignature(jsonBody) {
    let hmac = crypto.createHmac('sha256', GITHUB_HOOK_SECRET);
    hmac.update(toNormalizedJsonString(jsonBody), 'utf-8');
    return `sha256=${hmac.digest('hex')}`;
}

function isSignatureValid(requestBody, headers) {
    return (
        createHexSignature(requestBody) == headers.get('X-Hub-Signature-256')
    );
}

function createResponse(message, status = 200) {
    return new Response(message, {
        headers: { 'content-type': 'text/plain' },
        status,
    });
}

/**
 * Calls a Slack webhook with the event of interest
 * @param {Object} payload - the GitHub event payload
 */
async function forwardEvent(payload) {
    return await fetch(SLACK_HOOK_URL, {
        headers: {
            'Content-type': 'application/json; charset: utf8',
        },
        method: 'POST',
        body: JSON.stringify({
            text: `Repository ${payload['repository']['full_name']} is now public. Event: ${payload['action']}`,
            icon_emoji: ':warning:',
        }),
    });
}

/**
 * Process GitHub repository events
 * @param {Request} request
 */
async function handleRequest(request) {
    const event = request.headers.get('X-GitHub-Event');
    if (request.headers.get('Content-Type') != 'application/json') {
        return createResponse('Bad request', 400);
    }
    const payload = await request.json();
    if (!isSignatureValid(payload, request.headers)) {
        return createResponse('Invalid signature', 403);
    }
    if (event == 'repository') {
        if (
            payload['action'] == 'created' &&
            payload['repository']['private'] == false
        ) {
            await forwardEvent(payload);
            return createResponse('Proxied as public creation');
        } else if (payload['action'] == 'publicized') {
            await forwardEvent(payload);
            return createResponse('Proxied as publicized');
        }
    }
    return createResponse('Skipped');
}
