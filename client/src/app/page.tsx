import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.mainGrid}>
          <div className={styles.leftPanel}>
            <Image
              src="/interface-left.png"
              alt="Left interface"
              width={1000}
              height={1000}
              priority
              className={styles.panelImage}
            />
          </div>
          
          <div className={styles.centerPanel}>
            <div className={styles.content}>
              <h1 className={styles.title}>
                Streamline, Learn, and<br />
                Create a Virtual You<br />
                with One Click
              </h1>
              <p className={styles.subtitle}>
                Collect learning materials in one site, share and discuss with your students without burnout
              </p>
              <button className={styles.downloadButton}>
                Download Chrome Plugin
              </button>
            </div>
            <div className={styles.demoWrapper}>
              <Image
                src="/interface-center.png"
                alt="Center interface"
                width={600}
                height={600}
                priority
                className={styles.demoImage}
              />
            </div>
          </div>

          <div className={styles.rightPanel}>
            <Image
              src="/interface-right.png"
              alt="Right interface"
              width={1000}
              height={1000}
              priority
              className={styles.panelImage}
            />
          </div>
        </div>
      </main>

      <section className={styles.secondSection}>
        <div className={styles.imageColumn}>
          <Image
            src="/master_chat.png"
            alt="master_chat"
            width={500}
            height={300}
            className={styles.image}
          />
        </div>
        <div className={styles.wordsColumn}>
          <h2 className={styles.subtitle}>Let your knowledge base automatically respond to your audiences</h2>
          <p className={styles.description}>
            All the conversations are managed and analyzed based on your knowledge base. You can also get insights on all your followers and their questions.
          </p>
        </div>
      </section>

      <section className={styles.thirdSection}>
        <div className={styles.wordsColumn}>
          <h2 className={styles.subtitle}>Let your knowledge base automatically respond to your audiences</h2>
          <p className={styles.description}>
            All the conversations are managed and analyzed based on your knowledge base. You can also get insights on all your followers and their questions.
          </p>
        </div>
        <div className={styles.imageColumn}>
          <Image
            src="/master_analyze.png"
            alt="MasterChat Analysis"
            width={500}
            height={300}
            className={styles.image}
          />
        </div>
      </section>
    </div>
  );
}
