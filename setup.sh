cd client
npm install
npm run build
cp -n .env.example .env

cd ../server
npm install
npx prisma generate
cp -n .env.example .env