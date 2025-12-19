import SearchForm from "../../components/SearchForm/index";
import FeaturedJobs from "../../components/FeaturedJobs";
import FeaturedCompanies from "../../components/FeaturedCompanies";
import Testimonials from "../../components/Testimonials";
function Home() {
  return (
    <div>
      <SearchForm />
      <FeaturedJobs />
      <FeaturedCompanies />
      <Testimonials />
    </div>
  );
}
export default Home;
