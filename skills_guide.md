# 🛠️ Cẩm Nang Tra Cứu Nhanh Các Skills (Skills Quick Reference)

> [!NOTE]
> Tài liệu này tổng hợp ngắn gọn công dụng và trường hợp sử dụng của tất cả các **Skills** hiện có trong hệ thống, được phân loại theo từng nhóm lĩnh vực để bạn dễ dàng tìm kiếm và áp dụng khi làm việc.

## 📌 Mục Lục Nhanh
* [🧬 Nhóm Sinh Học & Khoa Học (Science & Bioinformatics)](#-nhóm-sinh-học--khoa-học-science--bioinformatics)

* [⚡ Nhóm Phát Triển & Tối Ưu Web (Web Development & Optimization)](#-nhóm-phát-triển--tối-ưu-web-web-development--optimization)

* [📱 Nhóm Phát Triển Mobile (Mobile Development)](#-nhóm-phát-triển-mobile-mobile-development)

* [🛠️ Nhóm Tiện Ích & Quy Trình Hệ Thống (Utilities & Workflows)](#-nhóm-tiện-ích--quy-trình-hệ-thống-utilities--workflows)

* [💡 Mẹo & Hướng Dẫn Sử Dụng Nhanh](#-mẹo--hướng-dẫn-sử-dụng-nhanh)

---

## 🧬 Nhóm Sinh Học & Khoa Học (Science & Bioinformatics)

| Tên Skill | Chức năng chính | 💡 Khi nào nên dùng? |
| :--- | :--- | :--- |
| **`alphafold-database-fetch-and-analyze`**<br>🏷️ *[🧬 Protein 3D]* | Tải và phân tích **cấu trúc protein dự đoán** từ AlphaFold Database. | Khi có mã **UniProt ID** cụ thể và cần phân tích cấu trúc 3D (độ tin cậy pLDDT, ranh giới domain). |

| **`alphagenome-single-variant-analysis`**<br>🏷️ *[🧬 Phân tích Gen]* | Phân tích ảnh hưởng của **biến thể di truyền phi mã (non-coding)** lên biểu hiện gen, cấu trúc chromatin... | Khi cần đánh giá **mức độ gây bệnh (pathogenicity)**, ảnh hưởng chức năng hoặc mối liên hệ bệnh lý của biến thể gen. |

| **`chembl-database`**<br>🏷️ *[🧪 Hoạt chất Hóa học]* | Tra cứu cơ sở dữ liệu **hoạt chất sinh học ChEMBL**. | Khi cần tìm kiếm thông tin về **hoạt chất, đích tác động của thuốc, cấu trúc hóa học** hoặc các chỉ số **IC50/Ki**. |

| **`clinical-trials-database`**<br>🏷️ *[💊 Thử nghiệm Lâm sàng]* | Tra cứu các **thử nghiệm lâm sàng** trên ClinicalTrials.gov. | Khi cần tìm kiếm thử nghiệm theo **điều kiện bệnh, loại thuốc, trạng thái tuyển chọn** hoặc nhà tài trợ. |

| **`clinvar-database`**<br>🏷️ *[🧬 Di truyền Lâm sàng]* | Tra cứu phân loại lâm sàng và **mức độ gây bệnh** của biến thể gen di truyền người. | Khi cần xác định một biến thể gen là **Lành tính (Benign)**, **Gây bệnh (Pathogenic)** hay **Chưa rõ ý nghĩa (VUS)**. |

| **`dbsnp-database`**<br>🏷️ *[🧬 Biến thể Gen]* | Tra cứu, ánh xạ và tìm kiếm các **biến thể di truyền ngắn (SNPs, indels)** trong dbSNP của NCBI. | Khi cần chuyển đổi giữa **rsID, tọa độ VCF, hoặc chuỗi HGVS** và kiểm tra tần số allele. |

| **`embl-ebi-ols`**<br>🏷️ *[📚 Từ điển Y sinh]* | Truy vấn dịch vụ tra cứu thuật ngữ bản đồ **Ontology (OLS)** của EMBL-EBI. | Khi cần tìm định nghĩa, phân cấp thuật ngữ y sinh (như **GO, DOID, HP**) trên hơn 250 ontologies. |

| **`encode-ccres-database`**<br>🏷️ *[🧬 Điều hòa Gen]* | Tra cứu các **yếu tố điều hòa cis (cCREs)** từ dự án ENCODE. | Khi cần truy vấn dữ liệu hoạt động **điều hòa gen** hoặc dữ liệu thực nghiệm (ChIP-seq peaks) trên các dòng tế bào người. |

| **`ensembl-database`**<br>🏷️ *[🧬 Bản đồ Gen]* | Ánh xạ và chuyển đổi chéo **ID gen/transcript/protein** và dự đoán hậu quả biến thể (**VEP**). | Khi cần lấy **chuỗi trình tự gen, cấu trúc exon-intron** hoặc dịch chéo giữa các ID di truyền khác nhau. |

| **`foldseek-structural-search`**<br>🏷️ *[🧬 Cấu trúc Protein]* | Tìm kiếm **cấu trúc protein 3D tương đồng** siêu tốc bằng Foldseek. | **Chỉ dùng** khi bạn có file tọa độ 3D (`.pdb`, `.cif`) và muốn tìm protein có cấu trúc tương tự. |

| **`gnomad-database`**<br>🏷️ *[🧬 Di truyền Quần thể]* | Tra cứu **tần suất biến thể** trong quần thể người và mức độ nhạy cảm đối với đột biến mất chức năng (**pLI/LOEUF**). | Khi cần đánh giá **độ hiếm** của biến thể gen trong cộng đồng tự nhiên. |

| **`gtex-database`**<br>🏷️ *[🧬 Biểu hiện Gen]* | Tra cứu mức độ biểu hiện gen định lượng và dữ liệu **eQTL** trên 54 mô cơ thể người khỏe mạnh. | Khi cần biết gen biểu hiện mạnh/yếu ở **những mô/cơ quan nào** cụ thể. |

| **`human-protein-atlas-database`**<br>🏷️ *[🧬 Định vị Protein]* | Tra cứu mức độ biểu hiện protein và **vị trí phân bố** trong tế bào/mô người từ Human Protein Atlas. | Khi cần biết **protein định vị ở đâu** trong tế bào (nhân, tế bào chất...) hoặc mô thực tế. |

| **`interpro-database`**<br>🏷️ *[🧬 Protein Domain]* | Nhận diện các **domain, họ gen (family)** và vị trí hoạt động trên chuỗi protein. | Khi cần phân tích **chức năng của protein** dựa trên các domain đặc trưng mà nó sở hữu. |

| **`jaspar-database`**<br>🏷️ *[🧬 Điều hòa Gen]* | Tra cứu hồ sơ liên kết của các **Nhân Tố Phiên Mã (Transcription Factors)** từ JASPAR. | Khi cần lấy **ma trận tần số vị trí (PFM/PWM)** để quét hoặc phân tích vùng promoter/enhancer. |

| **`ncbi-sequence-fetch`**<br>🏷️ *[🧬 Trình tự Gen]* | Tải chuỗi trình tự **Nucleotide (DNA/RNA) hoặc Protein** trực tiếp từ cơ sở dữ liệu NCBI. | Khi có mã **Accession ID**, tên gen hoặc mã bằng sáng chế và cần lấy chuỗi **FASTA** tương ứng. |

| **`opentargets-database`**<br>🏷️ *[💊 Phát triển Thuốc]* | Đánh giá mối liên hệ **Gen - Bệnh tật** phục vụ phát hiện đích thuốc mới. | Khi cần tìm kiếm các **gen/protein tiềm năng** liên quan đến một bệnh lý cụ thể để phát triển thuốc. |

| **`pdb-database`**<br>🏷️ *[🧬 Cấu trúc Thực nghiệm]* | Tra cứu và tải các **cấu trúc 3D thực nghiệm (PDB)** của protein, axit nucleic. | Khi cần tìm file cấu trúc thực nghiệm thực tế và các **thông số kỹ thuật** liên quan đến thí nghiệm tạo cấu trúc. |

| **`protein-sequence-msa`**<br>🏷️ *[🧬 Căn hàng Trình tự]* | Căn hàng đa trình tự (**Multiple Sequence Alignment - MSA**) sử dụng Clustal Omega. | Khi cần căn chỉnh tối đa **4000 chuỗi protein** để xem các acid amin bảo thủ hoặc sai khác. |

| **`protein-sequence-similarity-search`**<br>🏷️ *[🧬 Tìm kiếm Trình tự]* | Tìm kiếm trình tự protein tương đồng bằng **MMseqs2** hoặc **BLAST**. | Khi có một **chuỗi protein thô** (hoặc file FASTA) và muốn tìm các protein giống nó trong cơ sở dữ liệu. |

| **`pubchem-database`**<br>🏷️ *[🧪 Hóa chất & Dược phẩm]* | Tra cứu hóa chất, hoạt chất hóa học và thuốc trên **PubChem**. | Khi cần tìm kiếm chất theo tên, mã **CID**, hoặc chuỗi **SMILES** để xem thuộc tính hóa lý và hoạt tính sinh học. |

| **`pubmed-database`**<br>🏷️ *[📚 Nghiên cứu Y khoa]* | Tìm kiếm và tải bài báo, tóm tắt nghiên cứu y học/khoa học từ **PubMed**. | Khi cần tìm tài liệu nghiên cứu y khoa, **kiểm chứng học thuật** hoặc liên kết bài báo với các ID sinh học. |

| **`pymol`**<br>🏷️ *[🧬 Trực quan hóa 3D]* | Trực quan hóa, căn chỉnh cấu trúc và kết xuất hình ảnh **3D của protein/phân tử** qua PyMOL. | Khi cần xuất **ảnh cấu trúc đẹp**, đo khoảng cách tương tác, tô màu protein theo độ tin cậy (**pLDDT**) hoặc B-factor. |

| **`quickgo-database`**<br>🏷️ *[🧬 Chức năng Gen]* | Ánh xạ gen với các thuật ngữ **Gene Ontology** (Chức năng phân tử, Quá trình sinh học, Thành phần tế bào). | Khi cần tìm hiểu gen tham gia vào **con đường sinh học** nào hoặc thuộc nhóm chức năng nào. |

| **`reactome-database`**<br>🏷️ *[🧬 Con đường Sinh học]* | Phân tích làm giàu con đường sinh học (**Pathway Enrichment**) sử dụng Reactome. | Khi có danh sách gen/protein và muốn biết chúng hoạt động cùng nhau trong những **con đường chuyển hóa nào**. |

| **`string-database`**<br>🏷️ *[🧬 Mạng lưới Tương tác]* | Tra cứu mạng lưới tương tác **protein-protein (PPI)** và phân tích làm giàu chức năng. | Khi cần biết protein X tương tác hoặc **tạo phức hợp** với những protein nào khác. |

| **`ucsc-conservation-and-tfbs`**<br>🏷️ *[🧬 Bảo thủ Di truyền]* | Tra cứu điểm bảo thủ tiến hóa (**phyloP/phastCons**) và vị trí gắn nhân tố phiên mã từ UCSC. | Khi cần đánh giá xem một **vùng gen có được bảo thủ** qua các loài hay không, hoặc có phải vùng gắn TF không. |

| **`unibind-database`**<br>🏷️ *[🧬 Điều hòa Gen]* | Tải dữ liệu tọa độ thực nghiệm của các điểm gắn **Nhân tố phiên mã (TFBS)** đã được xác thực. | Khi cần lấy file **BED/FASTA** tọa độ điểm gắn TF chính xác phục vụ nghiên cứu thực nghiệm. |

| **`uniprot-database`**<br>🏷️ *[🧬 Tổng quan Protein]* | Tra cứu toàn diện thông tin, chức năng và tài liệu liên quan đến **Protein từ UniProt**. | Khi cần tìm hiểu thông tin tổng quan, **chức năng sinh học, vị trí hoạt động** hoặc chuỗi trình tự của một protein. |

---

## ⚡ Nhóm Phát Triển & Tối Ưu Web (Web Development & Optimization)

| Tên Skill | Chức năng chính | 💡 Khi nào nên dùng? |
| :--- | :--- | :--- |
| **`supabase`**<br>🏷️ *[🌐 Cloud Backend]* | Triển khai và tích hợp các dịch vụ của **Supabase** (Database, Auth, Storage, Edge Functions, RLS, CLI). | Dùng cho mọi tác vụ liên quan đến việc xây dựng ứng dụng với cơ sở dữ liệu và **xác thực người dùng** của Supabase. |

| **`supabase-postgres-best-practices`**<br>🏷️ *[💾 Tối ưu Database]* | Tối ưu hóa truy vấn **PostgreSQL**, thiết kế schema và cấu hình tối ưu trên Supabase. | Khi viết **trigger, phân quyền RLS, tối ưu chỉ mục (Index)** hoặc cải thiện hiệu năng câu lệnh SQL. |

| **`vercel-cli-with-tokens`**<br>🏷️ *[⚙️ Tự động hóa CI/CD]* | Triển khai và cấu hình dự án lên **Vercel** không cần đăng nhập tương tác (sử dụng Token). | Khi cần tự động hóa deploy, **quản lý biến môi trường** hoặc liên kết dự án với Vercel qua CLI. |

| **`deploy-to-vercel`**<br>🏷️ *[🌐 Cloud Deployment]* | Thực hiện hành động đẩy mã nguồn lên môi trường chạy thực tế (**Production/Preview**) trên Vercel. | Khi bạn muốn đưa ứng dụng lên mạng internet và nhận **đường dẫn chạy thử (Vercel Link)**. |

| **`vercel-composition-patterns`**<br>🏷️ *[⚛️ React Design Patterns]* | Hướng dẫn áp dụng các mẫu thiết kế React nâng cao (**Compound Components, Render Props, Context, React 19**). | Khi cần tái cấu trúc (**refactor**) các component React phức tạp, tránh lạm dụng quá nhiều props (prop drilling). |

| **`vercel-optimize`**<br>🏷️ *[⚡ Tối ưu Hiệu năng & Chi phí]* | Quét, phân tích và đề xuất giải pháp **tối ưu hóa chi phí cũng như hiệu năng** ứng dụng trên Vercel. | Khi muốn giảm hóa đơn thanh toán Vercel, tăng tốc độ tải trang (**Core Web Vitals**), tối ưu hóa cache hoặc giảm số lượt gọi Serverless Function. |

| **`vercel-react-best-practices`**<br>🏷️ *[⚛️ Tối ưu React]* | Các tiêu chuẩn vàng về **tối ưu hóa hiệu năng React và Next.js** từ kỹ sư Vercel. | Khi cần cải thiện **tốc độ render, tối ưu hóa code-splitting, lazy-loading** hoặc cải thiện kiến trúc data fetching. |

| **`vercel-react-view-transitions`**<br>🏷️ *[🎨 Hoạt ảnh UI/UX]* | Triển khai hiệu ứng chuyển trang mượt mà bằng **React View Transition API**. | Khi muốn tạo **hiệu ứng chuyển động** giữa các màn hình, chuyển hướng trang hoặc hoạt ảnh danh sách mà không cần thư viện bên thứ ba. |

| **`web-design-guidelines`**<br>🏷️ *[🎨 Tiêu chuẩn UI/UX]* | Kiểm tra và đánh giá giao diện người dùng (UI) theo các tiêu chuẩn thiết kế hiện đại và khả năng tiếp cận (**Accessibility - UX**). | Khi hoàn thành UI và muốn kiểm tra **độ tương thích màu sắc, tính dễ dùng**, khả năng hỗ trợ trình đọc màn hình. |

---

## 📱 Nhóm Phát Triển Mobile (Mobile Development)

| Tên Skill | Chức năng chính | 💡 Khi nào nên dùng? |
| :--- | :--- | :--- |

| **`android-cli`**<br>🏷️ *[📱 Android Dev]* | Quản lý, tạo mới, cấu hình và chạy các tác vụ liên quan đến ứng dụng **Android qua dòng lệnh**. | Khi cần cấu hình SDK, chuẩn bị **môi trường giả lập (emulator)** hoặc chạy các lệnh build Android tự động. |

| **`vercel-react-native-skills`**<br>🏷️ *[📱 Tối ưu Mobile]* | Các phương pháp tối ưu hóa hiệu năng và thiết kế ứng dụng di động bằng **React Native & Expo**. | Khi cần tối ưu hóa hiệu năng render danh sách dài (**FlatList**), xử lý hoạt ảnh (animations) hoặc tích hợp API native trên thiết bị di động. |

---

## 🛠️ Nhóm Tiện Ích & Quy Trình Hệ Thống (Utilities & Workflows)

| Tên Skill | Chức năng chính | 💡 Khi nào nên dùng? |
| :--- | :--- | :--- |
| **`code-review-excellence`**<br>🏷️ *[⚙️ Chất lượng Code]* | Hướng dẫn kiểm tra và đánh giá chất lượng mã nguồn (**Code Review**) trên nhiều ngôn ngữ (React, Vue, Angular, Rust, TS, Go...). | Khi cần rà soát lại mã nguồn trước khi tạo **Pull Request**, phát hiện lỗi bảo mật tiềm ẩn hoặc chuẩn hóa cấu trúc code. |

| **`literature-search-arxiv`**<br>🏷️ *[📚 Tra cứu Khoa học]* | Tìm kiếm, xem tóm tắt và tải tài liệu khoa học/bài báo dạng **PDF từ arXiv**. | Khi cần tìm kiếm các nghiên cứu mới nhất về **AI, Toán học, Vật lý** hoặc Khoa học máy tính. |

| **`literature-search-biorxiv`**<br>🏷️ *[📚 Tra cứu Y sinh]* | Duyệt và tải các bản thảo nghiên cứu sinh học/y học chưa qua bình duyệt từ **bioRxiv & medRxiv**. | Khi cần tìm các nghiên cứu sinh học mới nhất đang trong quá trình **chờ xuất bản chính thức**. |

| **`literature-search-openalex`**<br>🏷️ *[📚 Tra cứu Học thuật]* | Truy vấn kho dữ liệu học thuật khổng lồ **OpenAlex** để lấy thông tin bài báo, tác giả, trích dẫn, chỉ số h-index. | Khi cần thống kê nghiên cứu, tìm bài viết theo tác giả hoặc tổ chức, hoặc **tìm kiếm tài liệu đa ngành**. |

| **`literature-search-europepmc`**<br>🏷️ *[📚 Tra cứu Y sinh châu Âu]* | Tìm kiếm văn học khoa học châu Âu và tải bài báo miễn phí (**Open Access**) từ Europe PMC. | Khi cần tra cứu tài liệu y sinh học và tải trực tiếp bản toàn văn (**Full-text**). |

| **`uv`**<br>🏷️ *[⚙️ Môi trường Python]* | Trình quản lý gói Python siêu tốc viết bằng **Rust**. | Khi cần thiết lập **môi trường ảo Python** nhanh chóng để chạy các công cụ bổ trợ khoa học khác. |

| **`workflow-skill-creator`**<br>🏷️ *[⚙️ Tự động hóa Quy trình]* | Đóng gói một chuỗi các bước làm việc thủ công phức tạp thành một **Skill tái sử dụng được**. | Khi bạn đã cùng AI hoàn thành một quy trình làm việc rất tốt và muốn **biến nó thành công cụ có sẵn** cho lần sau. |

---

## 💡 Mẹo & Hướng Dẫn Sử Dụng Nhanh

> [!TIP]
> **Cách gọi một Skill nhanh chóng:**
> Bạn chỉ cần yêu cầu trực tiếp trong khung chat, ví dụ:
> * 💬 *"Hãy sử dụng skill `deploy-to-vercel` để đẩy trang web này lên giúp tôi."*
> * 🔬 *"Tra cứu gen BRCA1 trên mô người bằng `human-protein-atlas-database`."*
> * 🛡️ *"Rà soát chất lượng file code này theo chuẩn của `code-review-excellence`."*

> [!NOTE]
> **Tìm kiếm thông minh (Smart Search):**
> Nhấn `Ctrl + F` (hoặc `Cmd + F` trên macOS) để nhanh chóng định vị các từ khóa trọng tâm như: *React*, *Next.js*, *Supabase*, *Protein*, *Gene*, *PubMed*, *Android*, v.v. Việc này giúp bạn chọn đúng công cụ hữu hiệu chỉ trong vài giây!
