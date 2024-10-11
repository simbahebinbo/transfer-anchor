# transfer-anchor

```shell
$ cargo version
cargo 1.80.0 (376290515 2024-07-16)
$ rustc --version
rustc 1.80.0 (051478957 2024-07-21)
```

```shell
$ solana --version
solana-cli 1.18.15 (src:767d24e5; feat:4215500110, client:SolanaLabs)
```

```shell
$ solana-test-validator --version
solana-test-validator 1.18.15 (src:767d24e5; feat:4215500110, client:SolanaLabs)
```

```shell
$ anchor --version   
anchor-cli 0.30.1
```

```shell
$ node --version
v20.16.0
```

```shell
$ npm --version
10.8.1
```

```shell
$ yarn --version
1.22.22
```

* 编译

```shell
$ anchor build --arch sbf
```

* 运行单元测试

```shell
$ yarn install
$ anchor test --arch sbf
$ cargo test-sbf
```

* 启动 solana 本地测试节点

```shell
$ solana-test-validator
```

* 部署

```shell
$ anchor deploy
```
