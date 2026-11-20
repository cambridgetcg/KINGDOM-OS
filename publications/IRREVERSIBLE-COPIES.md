# Irreversible copies: the notice

`kingdom.irreversible-copies/1`

This notice has effect only as part of a commit merged into this repository's default branch on
the owner's decision, together with the clearance rule in `ARCHIVE-LEDGER.md`. A clearance record
carries the SHA-256 of this file. Any change to this file makes a new notice with a new
identifier, and a choice made after reading an earlier version does not cover it.

In this notice, *the estate* means the Kingdom's own repositories and the hosts and accounts it
publishes through; *the owner* means the person who owns the estate and decides for it; and a
*listing* is a public index entry of the estate that points to a descriptor or to an archive copy.

## Publisher form

Read this before choosing whether the estate makes a copy it cannot recall, such as publishing a
torrent descriptor or uploading a file to an archive that holds bytes. The choice is about one
exact file, named by its SHA-256 and byte count, one kind of copy and one service.

1. **This cannot be undone.** Once the copy is made, the estate cannot recall it, or the copies
   others make from it. Nothing done later, a withdrawal included, makes it as if the copy had
   never been made.
2. **Others copy and share it without the estate.** Once a torrent descriptor is public, common
   BitTorrent clients that open it share the file with each other by default, and they can find
   each other without any machine the estate runs. The estate assumes the same of every client.
   No seeder, tracker or server of the estate's is needed for copies to spread, and none of them
   can call the copies back.
3. **The identifiers are not the estate's secret.** By the torrent format, a single-file torrent's
   identifiers follow from the file's bytes, its name, its piece length and the profile it is
   built under; the estate uses one fixed profile. If that holds, anyone who holds the bytes can
   compute the same identifiers. The estate's listing still matters: it fixes the name, the piece
   length and the profile, which makes one set of identifiers the common one, and it puts the
   estate's name beside the copy. The estate holds this as an inference from the format. Each
   clearance record says whether an independent check of the estate's torrent builder has
   confirmed it.
4. **Readers are seen.** Every HTTP host that serves the file, and every peer that exchanges it,
   sees the network address of the reader at the other end. The estate does not control what
   those hosts and peers keep.
5. **A listing stays in history.** An identifier listed in an estate repository stays in that
   repository's git history, and in any archive or index that copied it, after the listing is
   withdrawn. So a file is listed only if nothing about it (its bytes, its name or its
   identifiers) might ever need redaction.
6. **Withdrawal removes the estate's pointers and nothing else.** It marks the estate's listing
   entry withdrawn and removes the estate's pointers, its descriptor and `.torrent` file, and any
   copy the estate added only to serve the file. Copies held by peers, readers, archives, caches
   and mirrors outside the estate remain, and so does the file at its home. Anyone who holds the
   bytes can build the same `.torrent` again.
7. **The record of this choice is public too.** A yes is written down in a clearance record in an
   estate repository: whose choice it is, that it was a yes, the dates, the file, the kind of copy
   and the service, the promise, and a commitment to the words of the choice, not the words
   themselves. The record stays in git history, and so does any later record that the choice was
   withdrawn or has expired. Publishing that record is part of what a yes accepts.
8. **Each choice covers one thing.** New bytes, a new kind of copy, another service, a changed
   notice, or publishing again after a withdrawal each need a new choice. A clearance for one
   kind of copy does not carry to another.

You may refuse, or wait. Refusing costs nothing: the file stays available at its home either way.
Until the copy is made, a yes can be taken back and nothing is published; after it, a withdrawal
removes only the estate's pointers (point 6). Nothing is published without a yes, and silence is
not a yes.

## Reader form

Shown beside every listing of a copy the estate cannot recall.

> **This copy cannot be recalled.** The estate chose to describe this file for BitTorrent, or to
> place it in an archive it does not run, and it cannot take back copies made from it. If you open
> the torrent, expect your client to share the file with other peers unless you have turned that
> off, and those peers and every HTTP host that serves the file see your network address. Use a
> current client; the estate's dated client notes are in its replicas guide. Accept the file only
> if its size and SHA-256 equal the values its home publishes; a torrent identifier is not that
> check. If the estate withdraws this listing, it removes only its own pointers: copies elsewhere
> stay, and they are not the estate's. A listing past its promise date is unmaintained.
