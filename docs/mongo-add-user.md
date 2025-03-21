```sh
db.createUser(
  {
    user: "ssouser",
    pwd: "pwd",
    roles: [
      { role: "readWrite", db: "google_auth_poc", collection: "userlinks" }
    ]
  }
)
```