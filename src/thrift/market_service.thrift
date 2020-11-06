struct PdpRequest {
  1: required i32 productId
}

struct PdpResponse {
  1: optional i32 id
  2: optional string name
  3: optional i32 price
}

service Market {
  PdpResponse getPdp(1: PdpRequest request)
    (
      rest_verb = "get"
      rest_path = "/new_endpoint/{productId}"
    )
}
