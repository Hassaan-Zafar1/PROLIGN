# Deploying to ECS — runbook

Everything here needs YOUR AWS credentials configured locally (`aws configure`)
— I can't run these commands for you since I don't have access to your AWS
account. This is a copy-paste-ready sequence, already filled in with your real
account ID (`069519367008`) and region (`ap-south-1`). The one placeholder
still left to fill in as you go is `<CLOUDFRONT_DOMAIN>` — it doesn't exist
until step 9.

## 0. Budget alert (console, do this first)

Billing and Cost Management → Budgets → Create budget → Cost budget →
set $100 with alerts at $50/$80 via email. Two minutes, and it's the actual
safety net for the $100 ceiling — nothing below this line costs anywhere near
that for a few days of a `t3.medium`.

## 1. IAM user + AWS CLI (console + local, one-time)

This is the one part that's inherently manual — you can't use the AWS CLI
before you have credentials to configure it with.

1. IAM console → Users → Create user → programmatic access.
2. Attach policy `AmazonECS_FullAccess` (plus `AmazonEC2FullAccess`,
   `AmazonEC2ContainerRegistryFullAccess`, `AmazonSSMFullAccess`, `IAMFullAccess`
   — broad, but this is a throwaway account being deleted after Friday; not
   worth hand-scoping a minimal policy for a few days' use).
3. Create an access key, then locally:
   ```
   aws configure
   ```
4. Confirm it worked:
   ```
   aws sts get-caller-identity
   ```
   (Already done — account `069519367008`, user `dev-moeed`, both baked into
   the files below.)

## 2. ECR: create repos and push all 4 images

Yes, 4 — `edge` included, not just the 3 app services. Locally it's the stock
`nginx:1.27-alpine` with a bind-mounted config (`docker-compose.yml`), but ECS
has no equivalent host bind-mount without extra volume setup, so
`deploy/ecs/edge.Dockerfile` bakes the same config into a tiny custom image
instead.

```
aws ecr create-repository --repository-name prolign/edge
aws ecr create-repository --repository-name prolign/backend
aws ecr create-repository --repository-name prolign/ai-interviewer
aws ecr create-repository --repository-name prolign/rag-chatbot

aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 069519367008.dkr.ecr.ap-south-1.amazonaws.com

docker build --platform linux/amd64 --provenance=false -f deploy/ecs/edge.Dockerfile -t 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/edge:latest deploy/
docker build --platform linux/amd64 --provenance=false -t 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/backend:latest backend/
docker build --platform linux/amd64 --provenance=false -f backend/AI_interviewer/Dockerfile -t 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/ai-interviewer:latest backend/
docker build --platform linux/amd64 --provenance=false -t 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/rag-chatbot:latest backend/Rag_Chatbot/

docker push 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/edge:latest
docker push 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/backend:latest
docker push 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/ai-interviewer:latest
docker push 069519367008.dkr.ecr.ap-south-1.amazonaws.com/prolign/rag-chatbot:latest
```

## 3. IAM roles for ECS itself

```
aws iam create-role --role-name prolignTaskExecutionRole \
  --assume-role-policy-document file://deploy/ecs/task-execution-trust-policy.json
aws iam attach-role-policy --role-name prolignTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam put-role-policy --role-name prolignTaskExecutionRole \
  --policy-name ProlignSSMRead \
  --policy-document file://deploy/ecs/task-execution-ssm-policy.json

aws iam create-role --role-name prolignInstanceRole \
  --assume-role-policy-document file://deploy/ecs/instance-trust-policy.json
aws iam attach-role-policy --role-name prolignInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role
aws iam create-instance-profile --instance-profile-name prolignInstanceProfile
aws iam add-role-to-instance-profile --instance-profile-name prolignInstanceProfile \
  --role-name prolignInstanceRole
```

## 4. SSM: push every secret

Get each real value from `backend/.env` / `backend/Rag_Chatbot/app/.env` —
never paste these into chat, just run each command with the real value locally.

```
aws ssm put-parameter --name /prolign/prod/MONGO_URI --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/MONGO_DB_NAME --type SecureString --value "Prolign"
aws ssm put-parameter --name /prolign/prod/MONGODB_DB_NAME --type SecureString --value "Prolign"
aws ssm put-parameter --name /prolign/prod/JWT_SECRET --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/JWT_REFRESH_SECRET --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/JWT_EXPIRES_IN --type SecureString --value "15m"
aws ssm put-parameter --name /prolign/prod/JWT_REFRESH_EXPIRES_IN --type SecureString --value "7d"
aws ssm put-parameter --name /prolign/prod/EMAIL_HOST --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/EMAIL_PORT --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/EMAIL_USER --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/EMAIL_PASS --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/EMAIL_FROM --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/GOOGLE_CLIENT_ID --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/GOOGLE_CLIENT_SECRET --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/STRIPE_SECRET_KEY --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/STRIPE_WEBHOOK_SECRET --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/GROQ_API_KEY --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/SLACK_WEBHOOK_URL --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/SLACK_COMPLAINT_WEBHOOK_URL --type SecureString --value "<value>"
aws ssm put-parameter --name /prolign/prod/GROQ_MODEL --type SecureString --value "llama-3.3-70b-versatile"
aws ssm put-parameter --name /prolign/prod/FAQ_MATCH_THRESHOLD --type SecureString --value "0.4"
aws ssm put-parameter --name /prolign/prod/FAQ_MATCH_COUNT --type SecureString --value "3"
aws ssm put-parameter --name /prolign/prod/MEMORY_LIMIT --type SecureString --value "6"
```

## 5. Networking: use the account's default VPC

No custom VPC needed for a single throwaway instance — every AWS account has
one already.

```
aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text
aws ec2 describe-subnets --filters Name=vpc-id,Values=<VPC_ID> --query "Subnets[0].SubnetId" --output text

aws ec2 create-security-group --group-name prolign-sg --description "Prolign ECS instance" --vpc-id <VPC_ID>
# Note the returned GroupId as <SG_ID>. Inbound rule tightened to CloudFront's
# range comes in step 9, once the distribution exists — leave this open on 80
# from anywhere for now so you can test directly before CloudFront is live,
# then lock it down.
aws ec2 authorize-security-group-ingress --group-id <SG_ID> --protocol tcp --port 80 --cidr 0.0.0.0/0
```

## 6. ECS cluster + capacity

```
aws ecs create-cluster --cluster-name prolign

aws ec2 create-launch-template --launch-template-name prolign-lt \
  --launch-template-data '{
    "ImageId": "<ECS_OPTIMIZED_AL2023_AMI_ID>",
    "InstanceType": "t3.medium",
    "IamInstanceProfile": { "Name": "prolignInstanceProfile" },
    "SecurityGroupIds": ["<SG_ID>"],
    "UserData": "<BASE64_OF: #!/bin/bash\necho ECS_CLUSTER=prolign >> /etc/ecs/ecs.config>"
  }'
```
Find the current ECS-optimized AL2023 AMI ID for `ap-south-1` with:
```
aws ssm get-parameters --names /aws/service/ecs/optimized-ami/amazon-linux-2023/recommended --query "Parameters[0].Value" --output text
```
(parse the `image_id` field out of the returned JSON). Base64-encode the
user-data script with `echo -n '#!/bin/bash
echo ECS_CLUSTER=prolign >> /etc/ecs/ecs.config' | base64 -w0` (adjust for your
shell) — this is what tells the instance which cluster to join.

```
aws autoscaling create-auto-scaling-group --auto-scaling-group-name prolign-asg \
  --launch-template LaunchTemplateName=prolign-lt \
  --min-size 1 --max-size 1 --desired-capacity 1 \
  --vpc-zone-identifier <SUBNET_ID>
```

Wait for the instance to launch and register with the cluster (check
`aws ecs list-container-instances --cluster prolign` until it shows one), then
allocate and associate the Elastic IP:
```
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id <INSTANCE_ID> --allocation-id <ALLOCATION_ID>
```
Note the returned Public IP/DNS — this is what Atlas's Network Access
allowlist and CloudFront's origin (step 9) both need.

## 7. Task definition

Edit `deploy/ecs/task-definition.json`: replace every `069519367008`,
`ap-south-1`, and `<CLOUDFRONT_DOMAIN>` (the last one you won't have until step
9 — use a placeholder now, `register-task-definition` again after step 9 once
you know it, or just re-register once more later; task definitions are
versioned, so re-registering is cheap and expected here).

```
aws ecs register-task-definition --cli-input-json file://deploy/ecs/task-definition.json

aws ecs create-service --cluster prolign --service-name prolign-service \
  --task-definition prolign --desired-count 1 \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_ID>],securityGroups=[<SG_ID>],assignPublicIp=DISABLED}"
```
(`assignPublicIp=DISABLED` — the *task* doesn't need its own public IP;
`awsvpc` mode gives it an ENI on the same subnet as the instance, and the
instance's own Elastic IP from step 6 is what's actually public-facing.)

Verify: `aws ecs describe-services --cluster prolign --services prolign-service`
— wait for `runningCount: 1`.

## 8. Smoke test before CloudFront

```
curl http://<ELASTIC_IP>/api/health
curl http://<ELASTIC_IP>/interviewer/health
curl http://<ELASTIC_IP>/rag/
```
All three should respond before moving on — CloudFront adds a 5-15 minute
propagation delay each time you touch it, so it's worth confirming the
straightforward part works first.

## 9. CloudFront (console is easiest for a one-time setup)

CloudFront console → Create distribution:
- Origin domain: `<ELASTIC_IP>` (or the EIP's own public DNS name — check
  `aws ec2 describe-addresses --allocation-ids <ALLOCATION_ID>` for
  `PublicDnsName`), origin protocol **HTTP only**.
- Viewer protocol policy: **Redirect HTTP to HTTPS**.
- Cache policy: **CachingDisabled**. Origin request policy: **AllViewer**.
- Allowed methods: **all** (GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE).
- Origin response timeout: **60** (default 30 is too short for `/rag/chat`).

Wait for status `Deployed` (~5-15 min), then note the distribution's domain
(`<id>.cloudfront.net`) — this is `<CLOUDFRONT_DOMAIN>` everywhere above.

Then lock down the security group to only CloudFront's traffic:
```
aws ec2 revoke-security-group-ingress --group-id <SG_ID> --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <SG_ID> --protocol tcp --port 80 \
  --source-prefix-list-id $(aws ec2 describe-managed-prefix-lists --query "PrefixLists[?PrefixListName=='com.amazonaws.global.cloudfront.origin-facing'].PrefixListId" --output text)
```

## 10. Re-register the task definition with the real CloudFront domain

Update `GOOGLE_CALLBACK_URL` in `deploy/ecs/task-definition.json` with the real
`<CLOUDFRONT_DOMAIN>`, then:
```
aws ecs register-task-definition --cli-input-json file://deploy/ecs/task-definition.json
aws ecs update-service --cluster prolign --service prolign-service --task-definition prolign --force-new-deployment
```

## 11. Everything outside AWS

- **Atlas**: Network Access → allow the Elastic IP.
- **Google Cloud Console**: OAuth client → Authorized redirect URIs → add
  `https://<CLOUDFRONT_DOMAIN>/api/auth/google/callback`.
- **Stripe**: webhook endpoint → `https://<CLOUDFRONT_DOMAIN>/api/payments/webhook`.
- **Vercel** (`prolign.vercel.app` project settings → Environment Variables):
  ```
  VITE_API_BASE_URL=https://<CLOUDFRONT_DOMAIN>/api
  VITE_INTERVIEWER_API_URL=https://<CLOUDFRONT_DOMAIN>/interviewer
  VITE_CHATBOT_API_URL=https://<CLOUDFRONT_DOMAIN>/rag/chat
  ```
  Redeploy the Vercel project after setting these — Vite bakes them in at
  build time, so a plain env var change alone doesn't take effect without a
  rebuild.

## Teardown (Phase 5 in the main plan)

```
aws ecs update-service --cluster prolign --service prolign-service --desired-count 0
aws ecs delete-service --cluster prolign --service prolign-service
aws ecs delete-cluster --cluster prolign
aws autoscaling delete-auto-scaling-group --auto-scaling-group-name prolign-asg --force-delete
aws ec2 disassociate-address --association-id <ASSOCIATION_ID>
aws ec2 release-address --allocation-id <ALLOCATION_ID>
aws ecr delete-repository --repository-name prolign/edge --force
aws ecr delete-repository --repository-name prolign/backend --force
aws ecr delete-repository --repository-name prolign/ai-interviewer --force
aws ecr delete-repository --repository-name prolign/rag-chatbot --force
aws ssm delete-parameters --names $(aws ssm get-parameters-by-path --path /prolign/prod --query "Parameters[].Name" --output text)
```
Delete/disable the CloudFront distribution via the console first (or
`aws cloudfront get-distribution-config` + `update-distribution` with
`Enabled: false`, wait for `Deployed`, then `delete-distribution`) — do this
one first since it has the longest propagation delay.
