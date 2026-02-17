# **《联邦公民身份识别码系统CIIC》开发文档**
# 目录  
- <details>
  <summary>1.架构</summary>
  
  - [1.1.总则](#11总则)
  - [1.2.xxxx](#12xxxx)
  - [1.3.xxxxx](#13xxxxx)
  </details>

- <details>
  <summary>2.后端</summary>
  
  - [2.1.xx](#21xx)
  - [2.2.xxx](#22xxx)

  </details>

- <details>
  <summary>3.前端</summary>
  
  - [3.1.xx](#31xx)
  - [3.2.xxx](#32xxx)
  </details>

- <details>
  <summary>4.硬件</summary>
  
  - [4.1.x](#41x)
  - [4.2.xx](#42xx)
  - [4.3.xxx](#43xxx)
  - [4.4.xxxx、](#44xxxx)
  </details>

# 1.架构
## 1.1.总则
* 本仓库是公民安全部所属的开源代码仓库，用于存储联邦公民身份识别码系统（CIIC）和联邦公民护照管理系统（CPMS）等软件的开源代码。  
* 公民护照管理系统使用离线数据库，且各个市级行政区独立建设，公民身份识别码系统使用互联网数据库，且两套系统在护照管理机构必须物理隔离，使用独立的终端设备和网路；
* 公民在线下办理护照时，或者公民提供护照，由护照管理员使用公民档案索引号，并采集公民的视网膜信息，联网生成公民身份识别码；
* 通过将公民的档案资料离线储存，只使用档案索引号与联网的身份识别码系统关联，这样即使身份识别码泄漏，也不会泄漏公民的住址、照片、指纹等护照信息，身份识别码只存有档案索引号和视网膜信息；
* 要想获得公民的具体身份信息，只能在该公民所在市级行政区的公安局护照管理部门获得，如果公民的身份信息泄漏，追查泄漏者的范围大大缩小；且如果公民使用身份识别码犯罪的，通过身份识别码即可反推档案索引号，通过档案索引号就能精确找到公民身份资料；如此，在保护公民隐私和防止互联网犯罪之间保持最大的平衡。
* 联邦公民身份识别码由省代码+档案索引号+随机码组成，例：GDW20250123123456789Hj26E18nC12PO83，省代码为两位大写字母，档案索引号为性别码（男M女W）+生日码（出生年月日）+9位数字档案号组成，随机码由15位随机大写字母、小写字母和数字组成；
* 我们将两套系统建设完成后，将先在海外部署上线，并在有条件的海外地区建立起线下的护照办理点，虽然我们在中共统治的沦陷区无法立即使用，但我们希望通过这种曲线救国的方式把海外的华人团结起来，当我们的力量足够庞大的时候，我们将不再恐惧，感到恐惧的将是中共。
![alt text](https://raw.githubusercontent.com/ChinaNation/FRC/main/GMAQB/wenku/公民护照及身份识别码管理系统.png)

## CIIC 身份验证模块对接文档（v1）
1. 模块职责边界
身份验证模块（/Users/rhett/GMB/citizenchain/otherpallet/ciic-code-auth）只负责：
绑定身份验证
投票身份验证
不负责：
奖励发放（由 /Users/rhett/GMB/citizenchain/issuance/citizen-lightnode-issuance 负责）
提案业务规则（由投票/事项模块负责）
2. 核心身份模型
链上唯一身份依据：ciic_code（链上使用其哈希 ciic_hash）
约束：
一个账户同一时刻只绑定一个 ciic
一个 ciic 不能绑定多个账户
proposal_id 归属提案/投票模块，但可作为 CIIC 投票验签上下文参与签名，防跨提案复用。
3. 技术参数
签名算法：sr25519
签名长度：64 字节原始签名
运行时常量：
MaxCiicLength = 64
MaxCredentialNonceLength = 64
MaxCredentialSignatureLength = 64
绑定验签消息域（Runtime）：
("GMB_CIIC_BIND_V1", genesis_hash, account, ciic_hash, nonce)
投票验签消息域（Runtime）：
("GMB_CIIC_VOTE_V1", genesis_hash, account, ciic_hash, proposal_id, nonce)
4. 防重放规则
绑定防重放：
UsedCredentialNonce[nonce_hash]
投票防重放（已升级三元）：
UsedVoteNonce[(proposal_id, ciic_hash, nonce_hash)]
含义：
同一提案、同一身份、同一 nonce 只能使用一次。
5. 绑定流程（前端 ↔ CIIC ↔ 链）
前端提交账户公钥/地址给 CIIC 系统。
CIIC 系统基于档案索引号确认身份并生成/确认 ciic_code，签发绑定凭证（含 nonce、签名）。
前端调用链上 bind_ciic(ciic_code, credential)。
链上校验：
ciic_code 非空、nonce 非空
credential.ciic_code_hash == hash(ciic_code)
绑定 nonce 未使用
CIIC 签名有效
ciic 未被其他账户占用
校验通过后写入绑定关系并触发 OnCiicBound 回调（供发行模块发奖励）。
6. 投票验证流程
用户在前端看到提案（含 proposal_id），点击投票。
前端将 account + ciic_code + proposal_id + nonce (+ vote_choice) 发给 CIIC 系统。
CIIC 系统校验资格后签名返回。
前端提交投票交易到链上。
链上校验：
ciic 与账户绑定关系
CIIC 投票签名有效（签名上下文含 proposal_id）
三元防重放键未使用
通过后记票，失败则拒绝。
7. CIIC 系统需要提供的最小能力
绑定验签能力（对应 GMB_CIIC_BIND_V1）
投票验签能力（对应 GMB_CIIC_VOTE_V1）
生成一次性 nonce
保证 ciic_code 对应真实唯一身份（档案索引号体系内）