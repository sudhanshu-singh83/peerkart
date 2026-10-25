import { Link } from 'react-router-dom';
export default function Landing() {
  return (<>
    <section className="hero">
      <h1>Buy and sell used items with students of GLBITM</h1>
      <p>PeerKart is a campus-only marketplace. Books, cycles, calculators and hostel stuff - from students, for students.</p>
      <div className="row center"><Link to="/login" className="btn btn-outline">Sign In</Link><Link to="/login?mode=register" className="btn">Get Started</Link></div>
    </section>
    <section className="grid-3">
      <div className="panel"><h3>Verified students</h3><p>Only @glbitm.ac.in emails can join, confirmed with a one-time code.</p></div>
      <div className="panel"><h3>Affordable items</h3><p>Pick up second-hand books and gear at a fraction of the new price.</p></div>
      <div className="panel"><h3>Reuse on campus</h3><p>Give things a second life instead of throwing them away at semester end.</p></div>
    </section>
  </>);
}
