import styles from './profile.module.css';

const fakeData = {
  name: "Leonardo da Vinci",
  bio: "Hi! I'm Eric, a content creator known for engaging and quality content across blogs, social media, and more. Eager to bring your brand's story to life!",
  books: [
    { title: "Name of Book 1", rating: 12 },
    { title: "Name of Book 2", rating: 12 },
    { title: "Name of Book 3", rating: 12 },
    { title: "Name of Book 4", rating: 12 },
  ],
  videos: [
    { title: "Name of Video 1", rating: 12 },
    { title: "Name of Video 2", rating: 12 },
    { title: "Name of Video 3", rating: 12 },
    { title: "Name of Video 4", rating: 12 },
  ],
  podcasts: [
    { title: "Name of Podcast 1", rating: 12 },
    { title: "Name of Podcast 2", rating: 12 },
    { title: "Name of Podcast 3", rating: 12 },
    { title: "Name of Podcast 4", rating: 12 },
  ],
};

export default function ProfilePage() {
  return (
    
    <div className={styles.profileContainer}>
        
      <h1 className={styles.title}>{fakeData.name}</h1>
      <p className={styles.bio}>{fakeData.bio}</p>
      <div className={styles.importSection}>
        <h2 className={styles.importTitle}>Import Material</h2>
        <form className={styles.importForm}>
          <input
            type="text"
            placeholder="Material Title"
            className={styles.importInput}
            required
          />
          <select className={styles.importType} required>
            <option value="">Select Type</option>
            <option value="book">Book</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
          </select>
          <button type="submit" className={styles.importButton}>Import</button>
        </form>
      </div>
      <div className={styles.mediaSection}>
        <h2 className={styles.mediaTitle}>Media</h2>

        <section className={styles.mediaCategory}>
          <h3 className={styles.subTitle}>Books</h3>
          <ul className={styles.mediaList}>
            {fakeData.books.map((book, index) => (
              <li key={index} className={styles.mediaItem}>
                {book.title} - Rating: {book.rating}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.mediaCategory}>
          <h3 className={styles.subTitle}>Videos</h3>
          <ul className={styles.mediaList}>
            {fakeData.videos.map((video, index) => (
              <li key={index} className={styles.mediaItem}>
                {video.title} - Rating: {video.rating}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.mediaCategory}>
          <h3 className={styles.subTitle}>Podcasts</h3>
          <ul className={styles.mediaList}>
            {fakeData.podcasts.map((podcast, index) => (
              <li key={index} className={styles.mediaItem}>
                {podcast.title} - Rating: {podcast.rating}
              </li>
            ))}
          </ul>
        </section>
      </div>

      
    </div>
  );
}