# GitHub hawk - a public repo monitor
Cloudflare worker that processes GitHub repository webhooks and forwards the interesting ones through a Slack hook:
* New public repository is created (`created` action with `private` set to `false`)
* Private repo has been made public (`publicized` action)

## How to run
* Deploy to Cloudflare with `wrangler publish`
* Add a hook at GitHub organization level that is triggered for `repository` events (only `created` and `publicized` are used)
* Set the correct `GITHUB_HOOK_SECRET`
* Set the correct `SLACK_HOOK_URL`

For more information, see the [Cloudflare Workers CLI documentation](https://developers.cloudflare.com/workers/).
