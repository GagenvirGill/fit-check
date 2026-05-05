1. Add caching to the cloudflare images
2. Currently the image keys in the db store the entire url as well as the key, it should probably just store the key and then append the url or something
3. Figure out a clean solution for deleting items that currently exist inside of the outfits, maybe keep the image?
4. Add an archive option for clothes items
5. add a cloudflare worker app
  - it should have a worker for the 5 min health endpoint
  - a worker for daily db backups and another for daily r2 image backups
6. Going to need to figure out a way to run the migrations on the prod db that already exists and has data, may be easier to just make backups and do it from scratch or something
  - probably a good idea to the worker backup stuff from 5 before setting this up, as well as doing some rather serious manual testing entirely locally too, make see if I can get all the prod data to my local db (download postico maybe?)
7. Create separate envirnments for prod and development
8. Solve item delete / outfit reference race conditions
  - move outfit item references out of json layout checks into a relational join table (ex: `outfit_items`)
  - add foreign keys + indexes so reference checks are atomic and fast
  - then replace O(number_of_outfits) layout scans with indexed existence queries
9. Various minor issues
  - add missing indexes for high-traffic user-scoped reads/sorts (`items`, `categories`, `outfits`, and ownership checks)
  - split `GET /bootstrap` into paginated or staged loading so it is not an unbounded full snapshot
  - add fetch timeouts/cancellation for OAuth provider calls (token exchange + userinfo request)
  - make Google user upsert concurrency-safe (single-statement upsert or retry-on-conflict flow)
  - audit related queries for race conditions and move critical integrity checks into DB-enforced constraints where possible
10. Buy a domain?
