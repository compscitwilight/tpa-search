cd client
npm install
npm run build
cp .env.example .env

cd ../server
npm install
npx prisma generate
cp .env.example .env