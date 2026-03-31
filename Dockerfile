WORKDIR /server
COPY package.json package-lock.json* ./
RUN npm install
COPY server ./server
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["npx", "ts-node", "server/index.ts"]