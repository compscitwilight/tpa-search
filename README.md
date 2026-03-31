# tpa-search
A dedicated interface for searching the extensive subdirectories of <a href="https://theponyarchive.com/">The Pony Archive</a>.

## License
tpa-search is licensed under the MIT License.

## Installation
To get started, ensure that <a href="https://nodejs.org/en/download">Node.js</a> is installed on your system.

```sh
git clone https://github.com/compscitwilight/tpa-search
cd tpa-search
npm install 
npm run setup
```

That's it. You can now locally host your very own search interface for TPA.

### Database dumps
The index for tpa-search is entirely open for public use. You can locally download a snapshot of the current index using `wget`.

```sh
wget https://dumps.search.twilight.horse/public.sql.gz
gunzip public.sql.gz

# import into your own database
psql your_database < public.sql
```

## Todo
- [ ] Semantic search
- [ ] Uploader ID grouping (for YouTube archives)