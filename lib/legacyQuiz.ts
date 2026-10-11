// Quiz option order before answers were keyed by option id (saved progress v2 stored positions).
// Frozen: used only to turn an old saved position into the option text, then into its id.
// Never edit this when quiz content changes.

export const LEGACY_OPTIONS: Record<string, string[][]> = {
  "caching": [
    [
      "Writing a value into the cache after a miss read it from the database",
      "Deleting every entry",
      "Copying the database to disk"
    ],
    [
      "B",
      "A, the old value",
      "Nothing"
    ],
    [
      "Store a version or timestamp with each entry and keep only the newer one",
      "Use a bigger cache",
      "Read from the cache twice"
    ],
    [
      "It makes reads faster",
      "So a missed invalidation cannot leave an entry wrong forever",
      "Because invalidations are never needed"
    ],
    [
      "Read-heavy systems would otherwise need far more database capacity",
      "Databases cannot store data",
      "Caches never go stale"
    ],
    [
      "To let normal replication lag settle, so only real inconsistencies are counted",
      "Because checks are free",
      "To slow down writes"
    ]
  ],
  "cdns": [
    [
      "Copies of content on servers close to them",
      "A faster origin server",
      "Compressing every file twice"
    ],
    [
      "Deciding what each edge keeps, and making misses to the origin cheap",
      "Encrypting traffic and storing passwords",
      "Replacing DNS and the origin"
    ],
    [
      "It skips TCP and TLS handshakes before the first byte",
      "It makes the file smaller",
      "It turns the miss into a hit"
    ],
    [
      "It falls, because the pool is split into smaller pools",
      "It rises",
      "Nothing changes"
    ],
    [
      "So unpopular versions of a popular title do not take up scarce disk",
      "Because titles cannot be cached",
      "To make files load in order"
    ],
    [
      "Through the DNS answer for the site's name",
      "The origin redirects every request",
      "The browser picks at random"
    ]
  ],
  "consistent-hashing": [
    [
      "Almost every key maps to a different server, so most reads miss",
      "Only the new server's keys move",
      "Nothing; keys stay put"
    ],
    [
      "The first server point clockwise from the key's hash",
      "The server with the most keys",
      "A random server each time"
    ],
    [
      "Only the keys that server owned",
      "All keys",
      "Half the keys"
    ],
    [
      "To even out how much of the ring each server owns",
      "To encrypt keys",
      "So lookups need no search"
    ],
    [
      "Ten times the memory for little extra balance",
      "Correctness",
      "Nothing"
    ],
    [
      "Every lookup paid for a call to the single process that owned the ring",
      "The ring had too few points",
      "The hash function was slow"
    ]
  ],
  "databases": [
    [
      "When its log record is safely on disk",
      "When the data file is updated",
      "When a replica reads it"
    ],
    [
      "The change is lost",
      "It replays the log and the change is applied",
      "The database refuses to start"
    ],
    [
      "Every index is another structure to update and log on each write",
      "Indexes lock the whole table",
      "Indexes are stored on replicas only"
    ],
    [
      "Disk-level changes, so replicas are byte-for-byte copies",
      "Only SQL statements",
      "Nothing; replicas query the primary"
    ],
    [
      "So a crash midway can be repaired from the log",
      "Because logs are smaller than data",
      "To make reads faster"
    ],
    [
      "Old-version replicas kept receiving changes by replicating backwards from the new primary",
      "It took full backups and planned to restore",
      "It upgraded every host at once"
    ]
  ],
  "dns": [
    [
      "Immediately, because the authoritative servers notify it",
      "When its cached copy's TTL runs out and it asks again",
      "Only after you flush every resolver by hand"
    ],
    [
      "Your recursive resolver",
      "The root servers",
      "The .com servers",
      "The servers that are authoritative for example.com"
    ],
    [
      "Because records never change",
      "So most lookups are answered nearby instead of walking the whole chain",
      "To encrypt the answers"
    ],
    [
      "The address of example.com",
      "A referral to the servers that are authoritative for example.com",
      "Nothing; resolvers skip the .com servers"
    ],
    [
      "The registrar ignored the change",
      "Resolvers had cached the DS record, which .com tells them to keep for 24 hours",
      "Browsers cache DS records"
    ],
    [
      "Raise it, so the new address sticks",
      "Lower it well before the move, then raise it again afterwards",
      "Nothing; TTLs do not affect moves"
    ]
  ],
  "indexing": [
    [
      "It reads every row and checks each one",
      "It asks a replica",
      "It guesses from statistics"
    ],
    [
      "org_id = 7",
      "kind = 'error'",
      "Neither"
    ],
    [
      "Writes, because each one must update every index",
      "Reads on unindexed columns",
      "Nothing"
    ],
    [
      "For each word or fragment, the documents that contain it",
      "Each document in reverse order",
      "Rows sorted by primary key"
    ],
    [
      "Matching every fragment does not mean they appear next to each other",
      "The index is always out of date",
      "To decompress it"
    ],
    [
      "Ask every shard and merge the results",
      "Ask one shard",
      "Scan the original data"
    ]
  ],
  "load-balancing": [
    [
      "It can only return one address",
      "Resolvers cache its answers, so it cannot react quickly to one server being busy or down",
      "It does not work inside a data center"
    ],
    [
      "Requests differ in cost and servers differ in hardware",
      "Round-robin skips servers at random",
      "It only works with two servers"
    ],
    [
      "Subsets are faster to encrypt",
      "Connecting everyone to everyone needs callers times servers connections",
      "Servers can only accept one caller"
    ],
    [
      "The balancer used a load signal that looks healthy while the server is stuck",
      "Round-robin was turned off",
      "The subset was too large"
    ],
    [
      "Load balancing is impossible",
      "Decisions are made on slightly stale data, so the system must tolerate some lag and imbalance",
      "Reports must be sent on every request"
    ],
    [
      "Sends each server traffic in proportion to its weight",
      "Picks a server at random",
      "Sends everything to the heaviest server"
    ]
  ],
  "message-queues": [
    [
      "So the request can return at once and the work survives slowdowns",
      "To make the work run faster",
      "To avoid storing the work anywhere"
    ],
    [
      "The message is delivered again when its lease runs out",
      "The message is lost",
      "The queue stops"
    ],
    [
      "Because the same message can arrive more than once",
      "Because messages arrive out of order only",
      "Because acks are optional"
    ],
    [
      "A crash before it is copied can lose the message",
      "Every message is delivered twice",
      "Writes become slower"
    ],
    [
      "Retry with growing delays, then set it aside after a limit",
      "Retry immediately forever",
      "Delete it on the first failure"
    ],
    [
      "Its backlog lived in memory, and when memory filled it could neither add nor remove jobs",
      "Kafka was down",
      "Workers acknowledged too early"
    ]
  ],
  "replication": [
    [
      "Two machines both accepting writes as primary",
      "A replica falling behind",
      "A query split across replicas"
    ],
    [
      "The commit may be lost if no replica received it",
      "Nothing can be lost",
      "The replica rejects all writes forever"
    ],
    [
      "A dead or cut-off machine cannot help",
      "The primary is always busy",
      "It slows reads"
    ],
    [
      "So an isolated data center cannot promote a primary on its own",
      "To speed up reads",
      "Because one vote is always wrong"
    ],
    [
      "To spread reads and replace a failed primary quickly",
      "Because primaries cannot write",
      "To make writes faster"
    ],
    [
      "To avoid a cross-region round trip on every commit",
      "Other regions do not store data",
      "Raft forbids more votes"
    ]
  ],
  "sharding": [
    [
      "Every replica still holds all of the data",
      "Replicas cannot serve reads",
      "Replicas only store indexes"
    ],
    [
      "It must go to every shard",
      "It fails",
      "It goes to a random shard"
    ],
    [
      "One most queries include, shared by tables queried together",
      "A timestamp",
      "Any column with few values"
    ],
    [
      "Foreign keys, global unique indexes and cross-shard transactions",
      "Nothing changes",
      "Column types"
    ],
    [
      "480 divides evenly into many host counts, so you can grow a few hosts at a time",
      "Smaller numbers are faster",
      "512 is not allowed"
    ],
    [
      "So the step could be reversed with a configuration change",
      "Views are faster than tables",
      "Postgres requires it"
    ]
  ]
};
