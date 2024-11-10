package main

import (
    "log"
    "net/http"
)

func main() {
    // Define the directory to serve
    fs := http.FileServer(http.Dir("./")) // Replace with your directory
    http.Handle("/", fs)

    log.Println("Serving on http://localhost:8080")
    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        log.Fatal(err)
    }
}
