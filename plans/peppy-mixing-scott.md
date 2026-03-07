# Install Google Cloud CLI

## Context
herbert wants to install the Google Cloud CLI (gcloud) on Ubuntu 24.04 LTS x86_64. gcloud is not currently installed. Using the official apt package manager method from the Google Cloud docs.

## Plan

### Step 1 — Install prerequisites
```bash
sudo apt-get update && sudo apt-get install -y ca-certificates gnupg curl
```

### Step 2 — Import Google Cloud public key
```bash
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
```

### Step 3 — Add the gcloud apt repository
```bash
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
```

### Step 4 — Install gcloud CLI
```bash
sudo apt-get update && sudo apt-get install -y google-cloud-cli
```

## Verification
```bash
gcloud version
```
Should output gcloud CLI version info. Then optionally run `gcloud init` to authenticate and configure a project.

## Notes
- Ubuntu 24.04, x86_64 — fully supported
- Uses apt method (preferred for Ubuntu — handles updates via apt)
- To update in future: `sudo apt-get update && sudo apt-get upgrade google-cloud-cli`
